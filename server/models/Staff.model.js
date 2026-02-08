const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Staff name is required'],
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
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't return password by default
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[+]?[\d\s-()]+$/, 'Please provide a valid phone number']
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    department: {
        type: String,
        required: false,
        enum: ['BCA', 'MCA', 'BBA', 'MBA', 'B.Com', 'M.Com', 'BA Tamil', 'BA English', 'B.Sc Physics', 'B.Sc Mathematics', 'B.Sc Data Science', 'M.Sc Computer Science', 'MA Tamil', 'B.Com Bank Management', 'B.Com (CA)', 'Hospital Administration', 'B.Sc AI & ML', 'Other']
    },
    yearTaught: {
        type: [String],
        required: false,
        enum: ['1st Year', '2nd Year', '3rd Year']
    },
    assignments: [{
        department: {
            type: String,
            required: true,
            enum: ['BCA', 'MCA', 'BBA', 'MBA', 'B.Com', 'M.Com', 'BA Tamil', 'BA English', 'B.Sc Physics', 'B.Sc Mathematics', 'B.Sc Data Science', 'M.Sc Computer Science', 'MA Tamil', 'B.Com Bank Management', 'B.Com (CA)', 'Hospital Administration', 'B.Sc AI & ML', 'Other']
        },
        yearTaught: {
            type: [String],
            required: true,
            enum: ['1st Year', '2nd Year', '3rd Year']
        }
    }],
    subjects: {
        type: [String],
        required: [true, 'Subjects are required'],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'At least one subject must be assigned'
        }
    },
    role: {
        type: String,
        default: 'staff',
        enum: ['staff']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    profileImage: {
        type: String,
        default: null
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpire: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Hash password before saving
staffSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
staffSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to get staff's assigned students
staffSchema.methods.getAssignedStudents = async function () {
    const Student = mongoose.model('Student');
    
    // Build query conditions from assignments
    const conditions = [];
    
    // Check new structure
    if (this.assignments && this.assignments.length > 0) {
        this.assignments.forEach(assign => {
            conditions.push({
                department: assign.department,
                year: { $in: assign.yearTaught }
            });
        });
    }
    
    // Check old structure (for fallback)
    if (this.department && this.yearTaught && this.yearTaught.length > 0) {
        conditions.push({
            department: this.department,
            year: { $in: this.yearTaught }
        });
    }

    if (conditions.length === 0) return [];

    return await Student.find({
        $or: conditions,
        isActive: true
    }).sort({ rollNo: 1 });
};

// Indexes
staffSchema.index({ email: 1 });
staffSchema.index({ "assignments.department": 1 });

module.exports = mongoose.model('Staff', staffSchema);
