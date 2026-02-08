require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin.model');
const Staff = require('../models/Staff.model');
const Student = require('../models/Student.model');
const Attendance = require('../models/Attendance.model');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data
    console.log('Clearing existing data...');
    await Admin.deleteMany({});
    await Staff.deleteMany({});
    await Student.deleteMany({});
    await Attendance.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create Admin
    console.log('Creating admin account...');
    const admin = await Admin.create({
      name: 'System Administrator',
      email: 'admin@queenscollege.edu',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✅ Admin created:', admin.email, '/ admin123\n');

    // Create Staff
    console.log('Creating staff accounts...');
    const staff1 = await Staff.create({
      name: 'Dr. Rajesh Kumar',
      email: 'staff1@queenscollege.edu',
      password: 'staff123',
      phone: '+919876543210',
      address: '123 Faculty Street, Chennai',
      department: 'Computer Science',
      yearTaught: ['1st Year', '2nd Year'],
      subjects: ['Data Structures', 'Algorithms', 'Programming']
    });

    const staff2 = await Staff.create({
      name: 'Prof. Priya Sharma',
      email: 'staff2@queenscollege.edu',
      password: 'staff123',
      phone: '+919876543211',
      address: '456 College Road, Chennai',
      department: 'Computer Science',
      yearTaught: ['3rd Year', '4th Year'],
      subjects: ['Database Management', 'Web Development']
    });

    const staff3 = await Staff.create({
      name: 'Dr. Arun Patel',
      email: 'staff3@queenscollege.edu',
      password: 'staff123',
      phone: '+919876543212',
      address: '789 University Lane, Chennai',
      department: 'Electronics',
      yearTaught: ['1st Year', '2nd Year'],
      subjects: ['Digital Electronics', 'Microprocessors']
    });

    console.log('✅ Staff created: 3 accounts\n');

    // Create Students
    console.log('Creating student accounts...');
    
    const students = [];
    const departments = ['Computer Science', 'Electronics', 'Mechanical'];
    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    
    // Computer Science Students
    for (let i = 1; i <= 20; i++) {
      students.push({
        name: `Student CS ${i}`,
        email: `student.cs${i}@queenscollege.edu`,
        rollNo: `CS${String(i).padStart(3, '0')}`,
        department: 'Computer Science',
        year: i <= 5 ? '1st Year' : i <= 10 ? '2nd Year' : i <= 15 ? '3rd Year' : '4th Year',
        address: `${i} Student Street, Chennai`,
        batch: '2020-2024',
        semester: i <= 5 ? '1' : i <= 10 ? '3' : i <= 15 ? '5' : '7',
        parentPhone: `+9198765432${String(i).padStart(2, '0')}`
      });
    }

    // Electronics Students
    for (let i = 1; i <= 15; i++) {
      students.push({
        name: `Student EC ${i}`,
        email: `student.ec${i}@queenscollege.edu`,
        rollNo: `EC${String(i).padStart(3, '0')}`,
        department: 'Electronics',
        year: i <= 4 ? '1st Year' : i <= 8 ? '2nd Year' : i <= 12 ? '3rd Year' : '4th Year',
        address: `${i} Electronics Lane, Chennai`,
        batch: '2020-2024',
        semester: i <= 4 ? '1' : i <= 8 ? '3' : i <= 12 ? '5' : '7',
        parentPhone: `+9198765433${String(i).padStart(2, '0')}`
      });
    }

    // Mechanical Students
    for (let i = 1; i <= 10; i++) {
      students.push({
        name: `Student ME ${i}`,
        email: `student.me${i}@queenscollege.edu`,
        rollNo: `ME${String(i).padStart(3, '0')}`,
        department: 'Mechanical',
        year: i <= 3 ? '1st Year' : i <= 6 ? '2nd Year' : i <= 8 ? '3rd Year' : '4th Year',
        address: `${i} Mechanical Road, Chennai`,
        batch: '2020-2024',
        semester: i <= 3 ? '1' : i <= 6 ? '3' : i <= 8 ? '5' : '7',
        parentPhone: `+9198765434${String(i).padStart(2, '0')}`
      });
    }

    const createdStudents = await Student.insertMany(students);
    console.log(`✅ Students created: ${createdStudents.length} accounts\n`);

    // Create Sample Attendance Records
    console.log('Creating sample attendance records...');
    
    const attendanceRecords = [];
    const today = new Date();
    
    // Create attendance for last 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      // CS Students - Staff 1 (1st and 2nd Year)
      const csStudents = createdStudents.filter(s => 
        s.department === 'Computer Science' && 
        (s.year === '1st Year' || s.year === '2nd Year')
      );

      for (let period = 1; period <= 4; period++) {
        for (const student of csStudents) {
          // 85% attendance rate
          const status = Math.random() > 0.15 ? 'Present' : 'Absent';
          
          attendanceRecords.push({
            studentId: student._id,
            staffId: staff1._id,
            date,
            period,
            status,
            subject: staff1.subjects[period % staff1.subjects.length],
            timestamp: new Date(date.getTime() + period * 3600000)
          });
        }
      }

      // Electronics Students - Staff 3 (1st and 2nd Year)
      const ecStudents = createdStudents.filter(s => 
        s.department === 'Electronics' && 
        (s.year === '1st Year' || s.year === '2nd Year')
      );

      for (let period = 1; period <= 3; period++) {
        for (const student of ecStudents) {
          // 90% attendance rate
          const status = Math.random() > 0.10 ? 'Present' : 'Absent';
          
          attendanceRecords.push({
            studentId: student._id,
            staffId: staff3._id,
            date,
            period,
            status,
            subject: staff3.subjects[period % staff3.subjects.length],
            timestamp: new Date(date.getTime() + period * 3600000)
          });
        }
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log(`✅ Attendance records created: ${attendanceRecords.length} records\n`);

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 CREDENTIALS:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n👨‍💼 ADMIN LOGIN:');
    console.log('   Email: admin@queenscollege.edu');
    console.log('   Password: admin123');
    console.log('\n👨‍🏫 STAFF LOGIN:');
    console.log('   Email: staff1@queenscollege.edu (CS - 1st & 2nd Year)');
    console.log('   Email: staff2@queenscollege.edu (CS - 3rd & 4th Year)');
    console.log('   Email: staff3@queenscollege.edu (EC - 1st & 2nd Year)');
    console.log('   Password: staff123 (for all staff)');
    console.log('\n📊 DATABASE SUMMARY:');
    console.log(`   Admins: 1`);
    console.log(`   Staff: 3`);
    console.log(`   Students: ${createdStudents.length}`);
    console.log(`   Attendance Records: ${attendanceRecords.length}`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

const run = async () => {
  try {
    await connectDB();
    await seedDatabase();
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

run();
