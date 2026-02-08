const { validationResult } = require('express-validator');
const Student = require('../models/Student.model');
const Attendance = require('../models/Attendance.model');
const notificationService = require('../services/notification.service');

// @desc    Get staff dashboard statistics
// @route   GET /api/staff/dashboard/stats
// @access  Private/Staff
exports.getDashboardStats = async (req, res) => {
  try {
    const staffId = req.user.id;
    const staff = req.staff;

    // Get assigned students
    const assignedStudents = await staff.getAssignedStudents();
    const totalStudents = assignedStudents.length;

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.countDocuments({
      staffId,
      date: { $gte: today, $lt: tomorrow }
    });

    const todayPresent = await Attendance.countDocuments({
      staffId,
      date: { $gte: today, $lt: tomorrow },
      status: 'Present'
    });

    const todayAbsent = await Attendance.countDocuments({
      staffId,
      date: { $gte: today, $lt: tomorrow },
      status: 'Absent'
    });

    // Calculate attendance percentage
    const attendancePercentage = todayAttendance > 0 
      ? ((todayPresent / todayAttendance) * 100).toFixed(2)
      : 0;

    // Get recent attendance records
    const recentAttendance = await Attendance.find({ staffId })
      .populate('studentId', 'name rollNo department year')
      .sort({ timestamp: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        todayAttendance: {
          total: todayAttendance,
          present: todayPresent,
          absent: todayAbsent,
          percentage: attendancePercentage
        },
        recentAttendance,
        staffInfo: {
          department: staff.department,
          yearTaught: staff.yearTaught,
          assignments: staff.assignments,
          subjects: staff.subjects
        }
      }
    });
  } catch (error) {
    console.error('Staff dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching dashboard statistics'
    });
  }
};

// @desc    Get assigned students
// @route   GET /api/staff/students
// @access  Private/Staff
exports.getAssignedStudents = async (req, res) => {
  try {
    const staff = req.staff;
    const { year, department, search } = req.query;

    // Build conditions from all assignments
    let conditions = [];
    
    if (staff.assignments && staff.assignments.length > 0) {
      staff.assignments.forEach(assign => {
        // If filters provided, only include matching assignments
        if (department && assign.department !== department) return;
        
        let targetYears = assign.yearTaught;
        if (year && assign.yearTaught.includes(year)) {
          targetYears = [year];
        } else if (year) {
          // If a year is requested but it's not in THIS assignment, skip it
          return;
        }

        conditions.push({
          department: assign.department,
          year: { $in: targetYears }
        });
      });
    }

    // Fallback for old structure
    if (staff.department && staff.yearTaught && staff.yearTaught.length > 0) {
      if ((!department || staff.department === department) && 
          (!year || staff.yearTaught.includes(year))) {
        conditions.push({
          department: staff.department,
          year: { $in: year ? [year] : staff.yearTaught }
        });
      }
    }

    if (conditions.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    let query = {
      $or: conditions,
      isActive: true
    };

    // Search filter
    if (search) {
      query = {
        $and: [
          { $or: conditions },
          {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { rollNo: { $regex: search, $options: 'i' } }
            ]
          }
        ],
        isActive: true
      };
    }

    const students = await Student.find(query).sort({ rollNo: 1 });

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get assigned students error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching assigned students'
    });
  }
};

// @desc    Mark attendance
// @route   POST /api/staff/attendance
// @access  Private/Staff
exports.markAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { date, period, attendanceData, subject } = req.body;
    const staffId = req.user.id;
    const staff = req.staff;

    // Validate date
    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    // Check if staff has already marked attendance for this period with a DIFFERENT subject
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conflictingSubject = await Attendance.findOne({
      staffId,
      date: { $gte: startOfDay, $lte: endOfDay },
      period,
      subject: { $ne: subject }
    });

    if (conflictingSubject) {
      return res.status(400).json({
        success: false,
        error: `Attendance already marked for Period ${period} with subject "${conflictingSubject.subject}".`
      });
    }

    const attendanceRecords = [];
    const absentStudents = [];
    const errors_list = [];

    // Process each student's attendance
    for (const record of attendanceData) {
      try {
        const { studentId, status } = record;

        // Verify student belongs to staff's assigned classes
        const student = await Student.findOne({ _id: studentId, isActive: true });

        if (!student) {
          errors_list.push({
            studentId,
            error: 'Student not found or inactive'
          });
          continue;
        }

        // Check if student is in staff's assignments
        const isAssigned = (staff.assignments || []).some(a => 
          a.department === student.department && a.yearTaught.includes(student.year)
        ) || (staff.department === student.department && staff.yearTaught?.includes(student.year));

        if (!isAssigned) {
          errors_list.push({
            studentId: student.rollNo,
            error: 'Student not assigned to this staff'
          });
          continue;
        }

        // Check for duplicate attendance
        const duplicate = await Attendance.checkDuplicate(studentId, attendanceDate, period);
        
        if (duplicate) {
          // Update existing record
          duplicate.status = status;
          duplicate.subject = subject;
          duplicate.staffId = staffId;
          await duplicate.save();
          
          attendanceRecords.push(duplicate);
        } else {
          // Create new attendance record
          const attendance = await Attendance.create({
            studentId,
            staffId,
            date: attendanceDate,
            period,
            status,
            subject,
            notificationSent: false
          });

          attendanceRecords.push(attendance);
        }

        // Track absent students for notifications
        if (status === 'Absent') {
          absentStudents.push({
            student,
            period,
            date: attendanceDate
          });
        }
      } catch (error) {
        console.error('Error processing attendance for student:', record.studentId, error);
        errors_list.push({
          studentId: record.studentId,
          error: error.message
        });
      }
    }

    // Send notifications to parents of absent students
    if (absentStudents.length > 0) {
      // Run notification service in background
      notificationService.sendAbsentNotifications(absentStudents, staff)
        .then((results) => {
          console.log('Notifications sent:', results);
          
          // Update notification status
          absentStudents.forEach(async ({ student }) => {
            await Attendance.updateMany(
              {
                studentId: student._id,
                date: attendanceDate,
                period,
                status: 'Absent'
              },
              { notificationSent: true }
            );
          });
        })
        .catch((error) => {
          console.error('Error sending notifications:', error);
        });
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('attendance-marked', {
      date: attendanceDate,
      period,
      staffId,
      count: attendanceRecords.length
    });

    res.status(201).json({
      success: true,
      message: `Attendance marked for ${attendanceRecords.length} students`,
      data: {
        recordsCreated: attendanceRecords.length,
        absentCount: absentStudents.length,
        errors: errors_list
      }
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Error marking attendance'
    });
  }
};

// @desc    Get attendance records
// @route   GET /api/staff/attendance
// @access  Private/Staff
exports.getAttendance = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { startDate, endDate, status, period } = req.query;

    const query = { staffId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (status) {
      query.status = status;
    }

    if (period) {
      query.period = parseInt(period);
    }

    const attendance = await Attendance.find(query)
      .populate('studentId', 'name rollNo department year')
      .sort({ date: -1, period: 1 });

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching attendance records'
    });
  }
};

// @desc    Get attendance by date
// @route   GET /api/staff/attendance/date/:date
// @access  Private/Staff
exports.getAttendanceByDate = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { date } = req.params;

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      staffId,
      date: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('studentId', 'name rollNo department year')
      .sort({ period: 1 });

    // Group by period
    const groupedByPeriod = {};
    attendance.forEach(record => {
      if (!groupedByPeriod[record.period]) {
        groupedByPeriod[record.period] = [];
      }
      groupedByPeriod[record.period].push(record);
    });

    res.status(200).json({
      success: true,
      data: {
        date: targetDate,
        attendance: groupedByPeriod,
        total: attendance.length
      }
    });
  } catch (error) {
    console.error('Get attendance by date error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching attendance for date'
    });
  }
};
