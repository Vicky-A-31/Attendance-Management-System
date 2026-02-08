const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required']
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: [true, 'Staff ID is required']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    period: {
        type: Number,
        required: [true, 'Period is required'],
        min: [1, 'Period must be between 1 and 8'],
        max: [8, 'Period must be between 1 and 8']
    },
    status: {
        type: String,
        required: [true, 'Attendance status is required'],
        enum: ['Present', 'Absent'],
        default: 'Present'
    },
    subject: {
        type: String,
        default: null
    },
    remarks: {
        type: String,
        default: null
    },
    notificationSent: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate attendance entries
attendanceSchema.index({ studentId: 1, date: 1, period: 1 }, { unique: true });

// Indexes for faster queries
attendanceSchema.index({ staffId: 1, date: 1 });
attendanceSchema.index({ date: 1, period: 1 });
attendanceSchema.index({ status: 1 });

// Static method to get attendance statistics
attendanceSchema.statics.getStatistics = async function (filters = {}) {
    const { startDate, endDate, department, year, staffId } = filters;

    const matchStage = {};

    if (startDate && endDate) {
        matchStage.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (staffId) {
        matchStage.staffId = mongoose.Types.ObjectId(staffId);
    }

    const pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: 'students',
                localField: 'studentId',
                foreignField: '_id',
                as: 'student'
            }
        },
        { $unwind: '$student' }
    ];

    if (department) {
        pipeline.push({ $match: { 'student.department': department } });
    }

    if (year) {
        pipeline.push({ $match: { 'student.year': year } });
    }

    pipeline.push({
        $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            presentCount: {
                $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
            },
            absentCount: {
                $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
            }
        }
    });

    const result = await this.aggregate(pipeline);

    if (result.length === 0) {
        return {
            totalRecords: 0,
            presentCount: 0,
            absentCount: 0,
            attendancePercentage: 0
        };
    }

    const stats = result[0];
    stats.attendancePercentage = stats.totalRecords > 0
        ? ((stats.presentCount / stats.totalRecords) * 100).toFixed(2)
        : 0;

    return stats;
};

// Method to check if attendance already exists
attendanceSchema.statics.checkDuplicate = async function (studentId, date, period) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.findOne({
        studentId,
        date: { $gte: startOfDay, $lte: endOfDay },
        period
    });
};

module.exports = mongoose.model('Attendance', attendanceSchema);
