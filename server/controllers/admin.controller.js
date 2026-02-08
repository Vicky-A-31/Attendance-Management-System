const { validationResult } = require("express-validator");
const Student = require("../models/Student.model");
const Staff = require("../models/Staff.model");
const Admin = require("../models/Admin.model");
const Attendance = require("../models/Attendance.model");
const fs = require("fs");
const csv = require("csv-parser");
const XLSX = require("xlsx");

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get counts
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalStaff = await Staff.countDocuments({ isActive: true });

    // Today's attendance
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
    });

    const todayPresent = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: "Present",
    });

    const todayAbsent = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: "Absent",
    });

    // Calculate attendance percentage
    const attendancePercentage =
      todayAttendance > 0
        ? ((todayPresent / todayAttendance) * 100).toFixed(2)
        : 0;

    // Get department-wise student count
    const studentDeptStats = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$department",
          studentCount: { $sum: 1 },
        },
      },
    ]);

    // Get department-wise staff count
    // We need to unwind assignments for multi-assignment staff
    const staffDeptStats = await Staff.aggregate([
      { $match: { isActive: true } },
      {
        $project: {
          depts: {
            $setUnion: [
              { $ifNull: ["$assignments.department", []] },
              {
                $cond: [
                  { $ifNull: ["$department", false] },
                  ["$department"],
                  [],
                ],
              },
            ],
          },
        },
      },
      { $unwind: "$depts" },
      {
        $group: {
          _id: "$depts",
          staffCount: { $sum: 1 },
        },
      },
    ]);

    // Combine stats
    const departments = [
      ...new Set([
        ...studentDeptStats.map((d) => d._id),
        ...staffDeptStats.map((d) => d._id),
      ]),
    ];
    const departmentStats = departments
      .map((dept) => {
        const studentStat = studentDeptStats.find((d) => d._id === dept);
        const staffStat = staffDeptStats.find((d) => d._id === dept);
        return {
          _id: dept,
          studentCount: studentStat?.studentCount || 0,
          staffCount: staffStat?.staffCount || 0,
        };
      })
      .sort((a, b) => b.studentCount - a.studentCount);

    // Get recent attendance records
    const recentAttendance = await Attendance.find()
      .populate("studentId", "name rollNo department year")
      .populate("staffId", "name")
      .sort({ timestamp: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalStaff,
        todayAttendance: {
          total: todayAttendance,
          present: todayPresent,
          absent: todayAbsent,
          percentage: attendancePercentage,
        },
        departmentStats,
        recentAttendance,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching dashboard statistics",
    });
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
exports.getAllStudents = async (req, res) => {
  try {
    const {
      department,
      year,
      semester,
      batch,
      search,
      isActive,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    // Handle isActive filter
    if (isActive !== undefined && isActive !== "all") {
      if (isActive === "true" || isActive === "active") {
        query.isActive = true;
      } else if (isActive === "false" || isActive === "inactive") {
        query.isActive = false;
      }
    }
    // If no isActive filter specified, show all students (both active and inactive)

    if (department) query.department = department;
    if (year) query.year = year;
    if (semester) query.semester = semester;
    if (batch) query.batch = batch;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { rollNo: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const students = await Student.find(query)
      .sort({ rollNo: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Student.countDocuments(query);

    // Total counts for stats cards (ignoring filters)
    const stats = {
      total: await Student.countDocuments({}),
      active: await Student.countDocuments({ isActive: true }),
      inactive: await Student.countDocuments({ isActive: false }),
      filtered: count,
    };

    res.status(200).json({
      success: true,
      data: students,
      stats,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching students",
    });
  }
};

// @desc    Get student by ID
// @route   GET /api/admin/students/:id
// @access  Private/Admin
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found",
      });
    }

    // Get attendance statistics
    const attendancePercentage = await student.getAttendancePercentage();

    res.status(200).json({
      success: true,
      data: {
        ...student.toObject(),
        attendancePercentage,
      },
    });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching student",
    });
  }
};

// @desc    Create new student
// @route   POST /api/admin/students
// @access  Private/Admin
exports.createStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Check if email or rollNo already exists
    const existingStudent = await Student.findOne({
      $or: [{ email: req.body.email }, { rollNo: req.body.rollNo }],
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        error: "Student with this email or roll number already exists",
      });
    }

    const student = await Student.create(req.body);

    // Emit socket event
    const io = req.app.get("io");
    io.emit("student-created", student);

    res.status(201).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({
      success: false,
      error: "Error creating student",
    });
  }
};

// @desc    Update student
// @route   PUT /api/admin/students/:id
// @access  Private/Admin
exports.updateStudent = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found",
      });
    }

    // Check if email or rollNo is being changed to an existing one
    if (req.body.email || req.body.rollNo) {
      const existingStudent = await Student.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(req.body.email ? [{ email: req.body.email }] : []),
          ...(req.body.rollNo ? [{ rollNo: req.body.rollNo }] : []),
        ],
      });

      if (existingStudent) {
        return res.status(400).json({
          success: false,
          error: "Student with this email or roll number already exists",
        });
      }
    }

    student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Emit socket event
    const io = req.app.get("io");
    io.emit("student-updated", student);

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({
      success: false,
      error: "Error updating student",
    });
  }
};

// @desc    Delete student (soft delete by default, hard delete with ?permanent=true)
// @route   DELETE /api/admin/students/:id
// @access  Private/Admin
exports.deleteStudent = async (req, res) => {
  try {
    console.log("Delete request received for ID:", req.params.id);
    console.log("Query params:", req.query);
    console.log("Permanent flag:", req.query.permanent);

    const student = await Student.findById(req.params.id);

    if (!student) {
      console.log("Student not found");
      return res.status(404).json({
        success: false,
        error: "Student not found",
      });
    }

    console.log("Student found:", student.name);
    const { permanent } = req.query;

    if (permanent === "true") {
      console.log("Performing HARD delete");
      // Hard delete - permanently remove from database
      const result = await Student.findByIdAndDelete(req.params.id);
      console.log("Delete result:", result ? "Success" : "Failed");

      // Emit socket event
      const io = req.app.get("io");
      if (io) {
        io.emit("student-deleted", { id: req.params.id, permanent: true });
      }

      return res.status(200).json({
        success: true,
        message: "Student permanently deleted",
      });
    } else {
      console.log("Performing SOFT delete");
      // Soft delete - mark as inactive using findByIdAndUpdate to skip validation
      await Student.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { runValidators: false }, // Skip validation for old records
      );

      // Emit socket event
      const io = req.app.get("io");
      if (io) {
        io.emit("student-deleted", { id: req.params.id, permanent: false });
      }

      return res.status(200).json({
        success: true,
        message: "Student deleted successfully",
      });
    }
  } catch (error) {
    console.error("Delete student error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: "Error deleting student: " + error.message,
    });
  }
};

// @desc    Bulk import students from CSV or Excel
// @route   POST /api/admin/students/bulk-import
// @access  Private/Admin
exports.bulkImportStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a CSV or Excel file",
      });
    }

    const students = [];
    const errors = [];
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    // Helper function to process student data
    const processStudents = async (studentsData) => {
      let successCount = 0;
      let errorCount = 0;

      for (const studentData of studentsData) {
        try {
          // Trim all string values
          Object.keys(studentData).forEach(key => {
            if (typeof studentData[key] === 'string') {
              studentData[key] = studentData[key].trim();
            }
          });

          // Validate required fields
          if (!studentData.name || !studentData.email || !studentData.rollNo) {
            errors.push({ 
              data: studentData, 
              error: "Missing required fields (name, email, rollNo)" 
            });
            errorCount++;
            continue;
          }

          // Validate department and year
          if (!studentData.department || !studentData.year) {
            errors.push({ 
              data: studentData, 
              error: "Missing required fields (department, year)" 
            });
            errorCount++;
            continue;
          }

          // Check for duplicates
          const existing = await Student.findOne({
            $or: [
              { email: studentData.email.toLowerCase() },
              { rollNo: studentData.rollNo.toUpperCase() },
            ],
          });

          if (existing) {
            errors.push({ 
              data: studentData, 
              error: `Duplicate: ${existing.email === studentData.email.toLowerCase() ? 'email' : 'roll number'} already exists` 
            });
            errorCount++;
            continue;
          }

          // Create student
          await Student.create(studentData);
          successCount++;
        } catch (error) {
          errors.push({ 
            data: studentData, 
            error: error.message 
          });
          errorCount++;
        }
      }

      return { successCount, errorCount };
    };

    // Handle Excel files
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const { successCount, errorCount } = await processStudents(jsonData);

        // Delete uploaded file
        fs.unlinkSync(req.file.path);

        // Emit socket event
        const io = req.app.get('io');
        if (io && successCount > 0) {
          io.emit('students-bulk-imported', { count: successCount });
        }

        return res.status(200).json({
          success: true,
          message: `Import completed. ${successCount} students added, ${errorCount} errors.`,
          data: {
            successCount,
            errorCount,
            errors: errors.slice(0, 20), // Return first 20 errors
          },
        });
      } catch (error) {
        // Delete uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw error;
      }
    }
    // Handle CSV files
    else if (fileExtension === 'csv') {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => {
          students.push(row);
        })
        .on("end", async () => {
          const { successCount, errorCount } = await processStudents(students);

          // Delete uploaded file
          fs.unlinkSync(req.file.path);

          // Emit socket event
          const io = req.app.get('io');
          if (io && successCount > 0) {
            io.emit('students-bulk-imported', { count: successCount });
          }

          res.status(200).json({
            success: true,
            message: `Import completed. ${successCount} students added, ${errorCount} errors.`,
            data: {
              successCount,
              errorCount,
              errors: errors.slice(0, 20), // Return first 20 errors
            },
          });
        })
        .on("error", (error) => {
          // Delete uploaded file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          throw error;
        });
    } else {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: "Invalid file format. Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
      });
    }
  } catch (error) {
    console.error("Bulk import error:", error);
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      error: "Error importing students: " + error.message,
    });
  }
};

// @desc    Get all staff
// @route   GET /api/admin/staff
// @access  Private/Admin
exports.getAllStaff = async (req, res) => {
  try {
    const { department, search, isActive, page = 1, limit = 50 } = req.query;

    const query = {};

    // Handle isActive filter
    if (isActive !== undefined && isActive !== "all") {
      if (isActive === "true" || isActive === "active") {
        query.isActive = true;
      } else if (isActive === "false" || isActive === "inactive") {
        query.isActive = false;
      }
    }

    if (department) {
      query.$or = [
        { department: department },
        { "assignments.department": department },
      ];
    }

    if (search) {
      const searchMatch = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };

      if (query.$or) {
        // If we already have a department $or, we must use $and to combine them
        query.$and = [{ $or: query.$or }, searchMatch];
        delete query.$or;
      } else {
        query.$or = searchMatch.$or;
      }
    }

    const staff = await Staff.find(query)
      .select("-password")
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Staff.countDocuments(query);

    // Total counts for stats cards (global, ignoring filters)
    const stats = {
      total: await Staff.countDocuments({}),
      active: await Staff.countDocuments({ isActive: true }),
      inactive: await Staff.countDocuments({ isActive: false }),
      filtered: count,
    };

    res.status(200).json({
      success: true,
      data: staff,
      stats,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching staff",
    });
  }
};

// @desc    Get staff by ID
// @route   GET /api/admin/staff/:id
// @access  Private/Admin
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).select("-password");

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: "Staff not found",
      });
    }

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching staff",
    });
  }
};

// @desc    Create new staff
// @route   POST /api/admin/staff
// @access  Private/Admin
exports.createStaff = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Check if email already exists
    const existingStaff = await Staff.findOne({ email: req.body.email });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        error: "Staff with this email already exists",
      });
    }

    // Set default password if not provided
    const staffDataToCreate = { ...req.body };
    if (!staffDataToCreate.password) {
      staffDataToCreate.password = "staff123";
    }

    const staff = await Staff.create(staffDataToCreate);

    // Remove password from response
    const staffData = staff.toObject();
    delete staffData.password;

    // Emit socket event
    const io = req.app.get("io");
    io.emit("staff-created", staffData);

    res.status(201).json({
      success: true,
      data: staffData,
    });
  } catch (error) {
    console.error("Create staff error:", error);
    res.status(500).json({
      success: false,
      error: "Error creating staff",
    });
  }
};

// @desc    Update staff
// @route   PUT /api/admin/staff/:id
// @access  Private/Admin
exports.updateStaff = async (req, res) => {
  try {
    let staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: "Staff not found",
      });
    }

    // Check if email is being changed to an existing one
    if (req.body.email) {
      const existingStaff = await Staff.findOne({
        _id: { $ne: req.params.id },
        email: req.body.email,
      });

      if (existingStaff) {
        return res.status(400).json({
          success: false,
          error: "Staff with this email already exists",
        });
      }
    }

    // Update fields
    const updateFields = [
      "name",
      "email",
      "phone",
      "address",
      "department",
      "yearTaught",
      "assignments",
      "subjects",
      "isActive",
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        staff[field] = req.body[field];
      }
    });

    // Handle password update separately
    if (req.body.password && req.body.password.trim() !== "") {
      staff.password = req.body.password;
    }

    await staff.save();

    // Remove password from response
    const staffData = staff.toObject();
    delete staffData.password;

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.emit("staff-updated", staffData);
    }

    res.status(200).json({
      success: true,
      data: staffData,
    });
  } catch (error) {
    console.error("Update staff error:", error);
    res.status(500).json({
      success: false,
      error: "Error updating staff",
    });
  }
};

// @desc    Delete staff (soft delete by default, hard delete with ?permanent=true)
// @route   DELETE /api/admin/staff/:id
// @access  Private/Admin
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: "Staff not found",
      });
    }

    const { permanent } = req.query;

    if (permanent === "true") {
      // Hard delete
      await Staff.findByIdAndDelete(req.params.id);

      const io = req.app.get("io");
      if (io) {
        io.emit("staff-deleted", { id: req.params.id, permanent: true });
      }

      res.status(200).json({
        success: true,
        message: "Staff permanently deleted",
      });
    } else {
      // Soft delete
      await Staff.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { runValidators: false },
      );

      const io = req.app.get("io");
      if (io) {
        io.emit("staff-deleted", { id: req.params.id, permanent: false });
      }

      res.status(200).json({
        success: true,
        message: "Staff deleted successfully",
      });
    }
  } catch (error) {
    console.error("Delete staff error:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting staff",
    });
  }
};

// @desc    Create new admin
// @route   POST /api/admin/admins
// @access  Private/Admin
exports.createAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email: req.body.email });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: "Admin with this email already exists",
      });
    }

    const admin = await Admin.create(req.body);

    // Remove password from response
    const adminData = admin.toObject();
    delete adminData.password;

    res.status(201).json({
      success: true,
      data: adminData,
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({
      success: false,
      error: "Error creating admin",
    });
  }
};

// @desc    Get attendance overview
// @route   GET /api/admin/attendance
// @access  Private/Admin
exports.getAttendanceOverview = async (req, res) => {
  try {
    const { startDate, endDate, department, year } = req.query;

    const filters = {};
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    if (department) filters.department = department;
    if (year) filters.year = year;

    const stats = await Attendance.getStatistics(filters);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Attendance overview error:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching attendance overview",
    });
  }
};

// @desc    Get student attendance
// @route   GET /api/admin/attendance/student/:studentId
// @access  Private/Admin
exports.getStudentAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { studentId: req.params.studentId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query)
      .populate("staffId", "name")
      .sort({ date: -1, period: 1 });

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Student attendance error:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching student attendance",
    });
  }
};
// @desc    Get all attendance records (with filters)
// @route   GET /api/admin/attendance/records
// @access  Private/Admin
exports.getAllAttendanceRecords = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      department,
      year,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    // If department or year filter is provided, we need to filter by student
    const studentFilters = {};
    if (department) studentFilters.department = department;
    if (year) studentFilters.year = year;

    let studentIds = null;
    if (Object.keys(studentFilters).length > 0) {
      const students = await Student.find(studentFilters).select("_id");
      studentIds = students.map((s) => s._id);
      query.studentId = { $in: studentIds };
    }

    const attendance = await Attendance.find(query)
      .populate("studentId", "name rollNo department year")
      .populate("staffId", "name")
      .sort({ date: -1, period: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: attendance,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get all attendance error:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching attendance records",
    });
  }
};
// @desc    Bulk import staff from CSV or Excel
// @route   POST /api/admin/staff/bulk-import
// @access  Private/Admin
exports.bulkImportStaff = async (req, res) => {
  const fs = require('fs');
  const csv = require('csv-parser');
  const XLSX = require('xlsx');
  const Staff = require('../models/Staff.model');
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a CSV or Excel file",
      });
    }

    const staffMembers = [];
    const errors = [];
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    // Helper function to process staff data
    const processStaff = async (staffData) => {
      let successCount = 0;
      let errorCount = 0;

      for (const staffMember of staffData) {
        try {
          // Trim all string values
          Object.keys(staffMember).forEach(key => {
            if (typeof staffMember[key] === 'string') {
              staffMember[key] = staffMember[key].trim();
            }
          });

          // Validate required fields
          if (!staffMember.name || !staffMember.email) {
            errors.push({ 
              data: staffMember, 
              error: "Missing required fields (name, email)" 
            });
            errorCount++;
            continue;
          }

          // Validate phone and address
          if (!staffMember.phone || !staffMember.address) {
            errors.push({ 
              data: staffMember, 
              error: "Missing required fields (phone, address)" 
            });
            errorCount++;
            continue;
          }

          // Parse subjects if it's a string (comma-separated)
          if (typeof staffMember.subjects === 'string') {
            staffMember.subjects = staffMember.subjects.split(',').map(s => s.trim()).filter(s => s);
          }

          // Validate subjects
          if (!staffMember.subjects || staffMember.subjects.length === 0) {
            errors.push({ 
              data: staffMember, 
              error: "At least one subject is required" 
            });
            errorCount++;
            continue;
          }

          // Parse assignments if provided as string (JSON format)
          if (typeof staffMember.assignments === 'string' && staffMember.assignments.trim()) {
            try {
              staffMember.assignments = JSON.parse(staffMember.assignments);
            } catch (e) {
              // If not JSON, try to parse as simple format: "dept:year1,year2|dept2:year3"
              const assignmentParts = staffMember.assignments.split('|');
              staffMember.assignments = assignmentParts.map(part => {
                const [dept, years] = part.split(':');
                return {
                  department: dept.trim(),
                  yearTaught: years.split(',').map(y => y.trim())
                };
              });
            }
          }

          // Check for duplicates
          const existing = await Staff.findOne({
            email: staffMember.email.toLowerCase()
          });

          if (existing) {
            errors.push({ 
              data: staffMember, 
              error: "Duplicate: email already exists" 
            });
            errorCount++;
            continue;
          }

          // Set default password if not provided
          if (!staffMember.password) {
            staffMember.password = "staff123";
          }

          // Create staff
          await Staff.create(staffMember);
          successCount++;
        } catch (error) {
          errors.push({ 
            data: staffMember, 
            error: error.message 
          });
          errorCount++;
        }
      }

      return { successCount, errorCount };
    };

    // Handle Excel files
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const { successCount, errorCount } = await processStaff(jsonData);

        // Delete uploaded file
        fs.unlinkSync(req.file.path);

        // Emit socket event
        const io = req.app.get('io');
        if (io && successCount > 0) {
          io.emit('staff-bulk-imported', { count: successCount });
        }

        return res.status(200).json({
          success: true,
          message: `Import completed. ${successCount} staff members added, ${errorCount} errors.`,
          data: {
            successCount,
            errorCount,
            errors: errors.slice(0, 20), // Return first 20 errors
          },
        });
      } catch (error) {
        // Delete uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw error;
      }
    }
    // Handle CSV files
    else if (fileExtension === 'csv') {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => {
          staffMembers.push(row);
        })
        .on("end", async () => {
          const { successCount, errorCount } = await processStaff(staffMembers);

          // Delete uploaded file
          fs.unlinkSync(req.file.path);

          // Emit socket event
          const io = req.app.get('io');
          if (io && successCount > 0) {
            io.emit('staff-bulk-imported', { count: successCount });
          }

          res.status(200).json({
            success: true,
            message: `Import completed. ${successCount} staff members added, ${errorCount} errors.`,
            data: {
              successCount,
              errorCount,
              errors: errors.slice(0, 20), // Return first 20 errors
            },
          });
        })
        .on("error", (error) => {
          // Delete uploaded file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          throw error;
        });
    } else {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: "Invalid file format. Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
      });
    }
  } catch (error) {
    console.error("Bulk import staff error:", error);
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      error: "Error importing staff: " + error.message,
    });
  }
};
