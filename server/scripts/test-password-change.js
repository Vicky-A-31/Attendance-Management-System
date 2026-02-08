const mongoose = require('mongoose');
const Admin = require('../models/Admin.model');
const Staff = require('../models/Staff.model');
require('dotenv').config();

async function testPasswordChange() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Test Admin Password Change
        console.log('=== Testing Admin Password Change ===');
        const admin = await Admin.findOne({ email: 'admin@queenscollege.edu' }).select('+password');
        
        if (!admin) {
            console.log('❌ Admin not found');
            return;
        }

        console.log('Admin found:', admin.email);
        console.log('Current password hash:', admin.password.substring(0, 20) + '...');

        // Test current password
        const isCurrentValid = await admin.comparePassword('admin123');
        console.log('Current password (admin123) valid:', isCurrentValid);

        // Change password
        console.log('\nChanging password to: newpass123');
        admin.password = 'newpass123';
        admin.markModified('password');
        
        console.log('Password marked as modified:', admin.isModified('password'));
        
        await admin.save();
        console.log('✅ Password saved');

        // Verify new password
        const adminAfter = await Admin.findOne({ email: 'admin@queenscollege.edu' }).select('+password');
        console.log('New password hash:', adminAfter.password.substring(0, 20) + '...');
        
        const isNewValid = await adminAfter.comparePassword('newpass123');
        console.log('New password (newpass123) valid:', isNewValid);
        
        const isOldStillValid = await adminAfter.comparePassword('admin123');
        console.log('Old password (admin123) still valid:', isOldStillValid);

        // Reset password back
        console.log('\nResetting password back to admin123');
        adminAfter.password = 'admin123';
        await adminAfter.save();
        console.log('✅ Password reset complete');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

testPasswordChange();
