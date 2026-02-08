const PDFDocument = require('pdfkit');
const Student = require('../models/Student.model');
const Attendance = require('../models/Attendance.model');
const Staff = require('../models/Staff.model');

const COLLEGE_NAME = process.env.COLLEGE_NAME || 'Queens College Arts and Science';

/**
 * Generate PDF header
 */
const generateHeader = (doc, title) => {
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(COLLEGE_NAME, 50, 50, { align: 'center' })
    .fontSize(14)
    .font('Helvetica')
    .text(title, 50, 80, { align: 'center' })
    .moveDown()
    .moveTo(50, 110)
    .lineTo(550, 110)
    .stroke();
};

/**
 * Generate PDF footer
 */
const generateFooter = (doc, pageNumber) => {
  doc
    .fontSize(10)
    .text(
      `Page ${pageNumber} | Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
};

// @desc    Generate student attendance report PDF
// @route   GET /api/reports/student/:studentId/pdf
// @access  Private/Admin/Staff
exports.generateStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Get student details
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Build query
    const query = { studentId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .populate('staffId', 'name')
      .sort({ date: -1, period: 1 });

    // Calculate statistics
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;
    const attendancePercentage = totalClasses > 0 
      ? ((presentCount / totalClasses) * 100).toFixed(2)
      : 0;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${student.rollNo}_${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Generate header
    generateHeader(doc, 'Student Attendance Report');

    // Student information
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Student Information', 50, 130)
      .font('Helvetica')
      .fontSize(10)
      .text(`Name: ${student.name}`, 50, 150)
      .text(`Roll No: ${student.rollNo}`, 50, 165)
      .text(`Department: ${student.department}`, 50, 180)
      .text(`Year: ${student.year}`, 50, 195)
      .text(`Batch: ${student.batch}`, 50, 210)
      .moveDown();

    // Attendance statistics
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Attendance Statistics', 50, 240)
      .font('Helvetica')
      .fontSize(10)
      .text(`Total Classes: ${totalClasses}`, 50, 260)
      .text(`Present: ${presentCount}`, 50, 275)
      .text(`Absent: ${absentCount}`, 50, 290)
      .text(`Attendance Percentage: ${attendancePercentage}%`, 50, 305)
      .moveDown();

    // Date range
    if (startDate && endDate) {
      doc
        .fontSize(10)
        .text(`Period: ${new Date(startDate).toLocaleDateString('en-IN')} to ${new Date(endDate).toLocaleDateString('en-IN')}`, 50, 325);
    }

    // Attendance table
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Attendance Records', 50, 355)
      .moveDown();

    let yPosition = 380;

    // Table headers
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Date', 50, yPosition)
      .text('Period', 120, yPosition)
      .text('Status', 180, yPosition)
      .text('Subject', 250, yPosition)
      .text('Staff', 350, yPosition);

    yPosition += 20;

    // Table rows
    doc.font('Helvetica').fontSize(8);

    attendanceRecords.forEach((record, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
        
        // Repeat headers on new page
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('Date', 50, yPosition)
          .text('Period', 120, yPosition)
          .text('Status', 180, yPosition)
          .text('Subject', 250, yPosition)
          .text('Staff', 350, yPosition);
        
        yPosition += 20;
        doc.font('Helvetica').fontSize(8);
      }

      const statusColor = record.status === 'Present' ? 'green' : 'red';
      
      doc
        .text(new Date(record.date).toLocaleDateString('en-IN'), 50, yPosition)
        .text(record.period.toString(), 120, yPosition)
        .fillColor(statusColor)
        .text(record.status, 180, yPosition)
        .fillColor('black')
        .text(record.subject || '-', 250, yPosition)
        .text(record.staffId?.name || '-', 350, yPosition);

      yPosition += 15;
    });

    // Footer
    generateFooter(doc, 1);

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Generate student report error:', error);
    res.status(500).json({
      success: false,
      error: 'Error generating student report'
    });
  }
};

// @desc    Generate class attendance report PDF
// @route   GET /api/reports/class/pdf
// @access  Private/Admin/Staff
exports.generateClassReport = async (req, res) => {
  try {
    const { department, year, startDate, endDate } = req.query;

    if (!department || !year) {
      return res.status(400).json({
        success: false,
        error: 'Department and year are required'
      });
    }

    // Get students in the class
    const students = await Student.find({
      department,
      year,
      isActive: true
    }).sort({ rollNo: 1 });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No students found for this class'
      });
    }

    // Build query
    const query = {
      studentId: { $in: students.map(s => s._id) }
    };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .populate('studentId', 'name rollNo')
      .sort({ date: -1 });

    // Calculate class statistics
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;
    const classPercentage = totalRecords > 0 
      ? ((presentCount / totalRecords) * 100).toFixed(2)
      : 0;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=class_attendance_${department}_${year}_${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Generate header
    generateHeader(doc, 'Class Attendance Report');

    // Class information
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Class Information', 50, 130)
      .font('Helvetica')
      .fontSize(10)
      .text(`Department: ${department}`, 50, 150)
      .text(`Year: ${year}`, 50, 165)
      .text(`Total Students: ${students.length}`, 50, 180)
      .moveDown();

    // Class statistics
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Overall Attendance Statistics', 50, 210)
      .font('Helvetica')
      .fontSize(10)
      .text(`Total Records: ${totalRecords}`, 50, 230)
      .text(`Present: ${presentCount}`, 50, 245)
      .text(`Absent: ${absentCount}`, 50, 260)
      .text(`Class Attendance: ${classPercentage}%`, 50, 275)
      .moveDown();

    // Date range
    if (startDate && endDate) {
      doc
        .fontSize(10)
        .text(`Period: ${new Date(startDate).toLocaleDateString('en-IN')} to ${new Date(endDate).toLocaleDateString('en-IN')}`, 50, 295);
    }

    // Student-wise attendance
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Student-wise Attendance', 50, 325)
      .moveDown();

    let yPosition = 350;

    // Table headers
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Roll No', 50, yPosition)
      .text('Name', 120, yPosition)
      .text('Total', 300, yPosition)
      .text('Present', 360, yPosition)
      .text('Absent', 420, yPosition)
      .text('%', 480, yPosition);

    yPosition += 20;

    // Table rows
    doc.font('Helvetica').fontSize(8);

    for (const student of students) {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
        
        // Repeat headers
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('Roll No', 50, yPosition)
          .text('Name', 120, yPosition)
          .text('Total', 300, yPosition)
          .text('Present', 360, yPosition)
          .text('Absent', 420, yPosition)
          .text('%', 480, yPosition);
        
        yPosition += 20;
        doc.font('Helvetica').fontSize(8);
      }

      const studentRecords = attendanceRecords.filter(r => r.studentId._id.toString() === student._id.toString());
      const studentTotal = studentRecords.length;
      const studentPresent = studentRecords.filter(r => r.status === 'Present').length;
      const studentAbsent = studentRecords.filter(r => r.status === 'Absent').length;
      const studentPercentage = studentTotal > 0 
        ? ((studentPresent / studentTotal) * 100).toFixed(1)
        : 0;

      doc
        .text(student.rollNo, 50, yPosition)
        .text(student.name, 120, yPosition, { width: 170 })
        .text(studentTotal.toString(), 300, yPosition)
        .text(studentPresent.toString(), 360, yPosition)
        .text(studentAbsent.toString(), 420, yPosition)
        .text(`${studentPercentage}%`, 480, yPosition);

      yPosition += 15;
    }

    // Footer
    generateFooter(doc, 1);

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Generate class report error:', error);
    res.status(500).json({
      success: false,
      error: 'Error generating class report'
    });
  }
};

// @desc    Generate date-wise attendance report PDF
// @route   GET /api/reports/date/:date/pdf
// @access  Private/Admin/Staff
exports.generateDateReport = async (req, res) => {
  try {
    const { date } = req.params;
    const { department, year } = req.query;

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

    // Build query
    const query = {
      date: { $gte: startOfDay, $lte: endOfDay }
    };

    // Get attendance records
    let attendanceRecords = await Attendance.find(query)
      .populate('studentId', 'name rollNo department year')
      .populate('staffId', 'name')
      .sort({ period: 1, 'studentId.rollNo': 1 });

    // Filter by department and year if provided
    if (department || year) {
      attendanceRecords = attendanceRecords.filter(record => {
        if (!record.studentId) return false;
        if (department && record.studentId.department !== department) return false;
        if (year && record.studentId.year !== year) return false;
        return true;
      });
    }

    // Calculate statistics
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;
    const attendancePercentage = totalRecords > 0 
      ? ((presentCount / totalRecords) * 100).toFixed(2)
      : 0;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${date}_${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Generate header
    generateHeader(doc, `Attendance Report - ${targetDate.toLocaleDateString('en-IN')}`);

    // Report information
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Report Information', 50, 130)
      .font('Helvetica')
      .fontSize(10)
      .text(`Date: ${targetDate.toLocaleDateString('en-IN')}`, 50, 150);

    if (department) doc.text(`Department: ${department}`, 50, 165);
    if (year) doc.text(`Year: ${year}`, 50, 180);

    doc.moveDown();

    // Statistics
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Attendance Statistics', 50, 210)
      .font('Helvetica')
      .fontSize(10)
      .text(`Total Records: ${totalRecords}`, 50, 230)
      .text(`Present: ${presentCount}`, 50, 245)
      .text(`Absent: ${absentCount}`, 50, 260)
      .text(`Attendance Percentage: ${attendancePercentage}%`, 50, 275)
      .moveDown();

    // Attendance table
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Attendance Records', 50, 305)
      .moveDown();

    let yPosition = 330;

    // Table headers
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Period', 50, yPosition)
      .text('Roll No', 100, yPosition)
      .text('Name', 160, yPosition)
      .text('Status', 300, yPosition)
      .text('Staff', 370, yPosition);

    yPosition += 20;

    // Table rows
    doc.font('Helvetica').fontSize(8);

    attendanceRecords.forEach((record) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
        
        // Repeat headers
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('Period', 50, yPosition)
          .text('Roll No', 100, yPosition)
          .text('Name', 160, yPosition)
          .text('Status', 300, yPosition)
          .text('Staff', 370, yPosition);
        
        yPosition += 20;
        doc.font('Helvetica').fontSize(8);
      }

      const statusColor = record.status === 'Present' ? 'green' : 'red';
      
      doc
        .text(record.period.toString(), 50, yPosition)
        .text(record.studentId?.rollNo || '-', 100, yPosition)
        .text(record.studentId?.name || '-', 160, yPosition, { width: 130 })
        .fillColor(statusColor)
        .text(record.status, 300, yPosition)
        .fillColor('black')
        .text(record.staffId?.name || '-', 370, yPosition);

      yPosition += 15;
    });

    // Footer
    generateFooter(doc, 1);

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Generate date report error:', error);
    res.status(500).json({
      success: false,
      error: 'Error generating date report'
    });
  }
};

// @desc    Generate a detailed filtered attendance report PDF
// @route   GET /api/reports/detailed/pdf
// @access  Private/Admin/Staff
exports.generateDetailedReport = async (req, res) => {
  try {
    const { startDate, endDate, department, year } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    // If department or year filter is provided, we need to filter by student
    if (department || year) {
      const studentFilters = {};
      if (department) studentFilters.department = department;
      if (year) studentFilters.year = year;

      const students = await Student.find(studentFilters).select('_id');
      const studentIds = students.map(s => s._id);
      query.studentId = { $in: studentIds };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('studentId', 'name rollNo department year')
      .populate('staffId', 'name')
      .sort({ date: -1, period: 1 });

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Generate header
    generateHeader(doc, 'Detailed Attendance Report');

    // Filter Information
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Filter Information:', 50, 130)
      .font('Helvetica')
      .text(`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`, 50, 145)
      .text(`Department: ${department || 'All Departments'}`, 300, 145)
      .text(`Year: ${year || 'All Years'}`, 300, 160)
      .text(`Total Records: ${attendanceRecords.length}`, 50, 160)
      .moveDown();

    // Attendance table
    let yPosition = 190;

    // Table headers
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Date', 50, yPosition)
      .text('Per.', 120, yPosition)
      .text('Roll No', 150, yPosition)
      .text('Student Name', 210, yPosition)
      .text('Status', 350, yPosition)
      .text('Staff', 420, yPosition);

    doc
      .moveTo(50, yPosition + 12)
      .lineTo(550, yPosition + 12)
      .stroke();

    yPosition += 20;

    // Table rows
    doc.font('Helvetica').fontSize(8);

    attendanceRecords.forEach((record) => {
      if (yPosition > 720) {
        doc.addPage();
        yPosition = 50;
        
        // Repeat headers
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('Date', 50, yPosition)
          .text('Per.', 120, yPosition)
          .text('Roll No', 150, yPosition)
          .text('Student Name', 210, yPosition)
          .text('Status', 350, yPosition)
          .text('Staff', 420, yPosition);
        
        doc
          .moveTo(50, yPosition + 12)
          .lineTo(550, yPosition + 12)
          .stroke();

        yPosition += 20;
        doc.font('Helvetica').fontSize(8);
      }

      const dateStr = new Date(record.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      doc
        .text(dateStr, 50, yPosition)
        .text(record.period.toString(), 120, yPosition)
        .text(record.studentId?.rollNo || '-', 150, yPosition)
        .text(record.studentId?.name || '-', 210, yPosition, { width: 130 })
        .fillColor(record.status === 'Present' ? 'green' : 'red')
        .text(record.status, 350, yPosition)
        .fillColor('black')
        .text(record.staffId?.name || '-', 420, yPosition);

      yPosition += 15;
    });

    // Footer
    generateFooter(doc, 1);

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Detailed report error:', error);
    res.status(500).json({
      success: false,
      error: 'Error generating detailed report'
    });
  }
};
