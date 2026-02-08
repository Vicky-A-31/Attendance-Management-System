const XLSX = require('xlsx');
const path = require('path');

// Create Student Import Template
const studentTemplate = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    rollNo: 'CS2024001',
    department: 'Computer Science',
    year: '1st Year',
    semester: '1',
    batch: '2024-2028',
    phone: '+1234567890',
    address: '123 Main Street, City, State, ZIP',
    dateOfBirth: '2005-01-15',
    bloodGroup: 'A+',
    parentPhone: '+1234567899'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    rollNo: 'CS2024002',
    department: 'Computer Science',
    year: '1st Year',
    semester: '1',
    batch: '2024-2028',
    phone: '+1234567891',
    address: '456 Oak Avenue, City, State, ZIP',
    dateOfBirth: '2005-03-20',
    bloodGroup: 'B+',
    parentPhone: '+1234567898'
  },
  {
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    rollNo: 'EE2024001',
    department: 'Electrical',
    year: '2nd Year',
    semester: '3',
    batch: '2023-2027',
    phone: '+1234567892',
    address: '789 Pine Road, City, State, ZIP',
    dateOfBirth: '2004-07-10',
    bloodGroup: 'O+',
    parentPhone: '+1234567897'
  }
];

// Create Staff Import Template
const staffTemplate = [
  {
    name: 'Dr. Sarah Williams',
    email: 'sarah.williams@example.com',
    phone: '+1234567800',
    address: '321 Faculty Lane, City, State, ZIP',
    subjects: 'Data Structures, Algorithms, Database Systems',
    assignments: 'Computer Science:1st Year,2nd Year',
    password: 'staff123'
  },
  {
    name: 'Prof. Robert Brown',
    email: 'robert.brown@example.com',
    phone: '+1234567801',
    address: '654 Professor Street, City, State, ZIP',
    subjects: 'Circuit Theory, Power Systems',
    assignments: 'Electrical:2nd Year,3rd Year',
    password: 'staff123'
  },
  {
    name: 'Dr. Emily Davis',
    email: 'emily.davis@example.com',
    phone: '+1234567802',
    address: '987 Academic Drive, City, State, ZIP',
    subjects: 'Machine Learning, Artificial Intelligence',
    assignments: 'Computer Science:3rd Year,4th Year|IT:3rd Year,4th Year',
    password: 'staff123'
  }
];

// Create workbooks
const studentWorkbook = XLSX.utils.book_new();
const staffWorkbook = XLSX.utils.book_new();

// Create worksheets from data
const studentWorksheet = XLSX.utils.json_to_sheet(studentTemplate);
const staffWorksheet = XLSX.utils.json_to_sheet(staffTemplate);

// Add worksheets to workbooks
XLSX.utils.book_append_sheet(studentWorkbook, studentWorksheet, 'Students');
XLSX.utils.book_append_sheet(staffWorkbook, staffWorksheet, 'Staff');

// Write files
XLSX.writeFile(studentWorkbook, path.join(__dirname, 'student-import-template.xlsx'));
XLSX.writeFile(staffWorkbook, path.join(__dirname, 'staff-import-template.xlsx'));

console.log('Templates created successfully!');
console.log('- student-import-template.xlsx');
console.log('- staff-import-template.xlsx');
