const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    rollNo: {
        type: String,
        required: [true, 'Roll number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['BCA', 'MCA', 'BBA', 'MBA', 'B.Com', 'M.Com', 'BA Tamil', 'BA English', 'B.Sc Physics', 'B.Sc Mathematics', 'B.Sc Data Science', 'M.Sc Computer Science', 'MA Tamil', 'B.Com Bank Management', 'B.Com (CA)', 'Hospital Administration', 'B.Sc AI & ML', 'Other']
    },
    year: {
        type: String,
        required: [true, 'Year is required'],
        enum: ['1st Year', '2nd Year', '3rd Year']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[+]?[\d\s-()]+$/, 'Please provide a valid phone number'],
        default: ''
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
        default: ''
    },
    batch: {
        type: String,
        trim: true,
        match: [/^(\d{4}-\d{4})?$/, 'Batch format should be YYYY-YYYY (e.g., 2020-2024)'],
        default: ''
    },
    semester: {
        type: String,
        enum: ['1', '2', '3', '4', '5', '6', '7', '8', ''],
        default: ''
    },
    parentPhone: {
        type: String,
        required: [true, 'Parent phone number is required'],
        trim: true,
        match: [/^[+]?[\d\s-()]+$/, 'Please provide a valid phone number']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    profileImage: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster queries
studentSchema.index({ department: 1, year: 1, semester: 1 });
studentSchema.index({ rollNo: 1 });
studentSchema.index({ email: 1 });

// Virtual for full identification
studentSchema.virtual('fullIdentification').get(function () {
    return `${this.name} (${this.rollNo})`;
});

// Method to get student's current attendance percentage
studentSchema.methods.getAttendancePercentage = async function (startDate, endDate) {
    const Attendance = mongoose.model('Attendance');

    const query = { studentId: this._id };
    if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
    }

    const totalClasses = await Attendance.countDocuments(query);
    const presentClasses = await Attendance.countDocuments({ ...query, status: 'Present' });

    return totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(2) : 0;
};

module.exports = mongoose.model('Student', studentSchema);
