# College Attendance Management System (MERN Stack)

**Queens College Arts and Science**

A complete full-stack web application for managing student attendance with real-time SMS/WhatsApp notifications to parents.

## Features

### Admin Features

- Complete dashboard with attendance statistics
- User management (Students & Staff)
- Attendance reports and PDF downloads
- Bulk student import via CSV
- System-wide analytics

### Staff Features

- Class-specific dashboard
- Period-wise attendance (1-8 periods)
- Real-time SMS/WhatsApp notifications to parents
- Attendance reports for assigned classes
- Student list management

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, React Router, Socket.io-client
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Notifications**: Twilio (SMS + WhatsApp)
- **PDF Generation**: jsPDF
- **Real-time**: Socket.io

## Project Structure

```
College Project for Viji/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Context API
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx
│   └── package.json
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── services/         # Business logic
│   └── server.js
├── .env.example          # Environment variables template
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Twilio Account (for SMS/WhatsApp)

### Installation

1. **Clone the repository**

```bash
cd "College Project for Viji"
```

2. **Setup Backend**

```bash
cd server
npm install
```

3. **Setup Frontend**

```bash
cd ../client
npm install
```

4. **Environment Variables**

Create `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/attendance_system

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

Create `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

5. **Seed Database (Optional)**

```bash
cd server
npm run seed
```

This creates:

- Default admin: email: `admin@college.edu`, password: `admin123`
- Sample staff and students

### Running the Application

1. **Start MongoDB** (if running locally)

```bash
mongod
```

2. **Start Backend Server**

```bash
cd server
npm run dev
```

3. **Start Frontend Development Server**

```bash
cd client
npm run dev
```

4. **Access the Application**

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Default Credentials

### Admin Login

- Email: `admin@queenscollege.edu`
- Password: `admin123`

### Staff Login

- Email: `staff1@queenscollege.edu`
- Password: `staff123`

## API Endpoints

### Authentication

- `POST /api/auth/login-admin` - Admin login
- `POST /api/auth/login-staff` - Staff login
- `POST /api/auth/verify` - Verify JWT token

### Admin Routes

- `GET /api/admin/students` - Get all students
- `POST /api/admin/students` - Add new student
- `PUT /api/admin/students/:id` - Update student
- `DELETE /api/admin/students/:id` - Delete student
- `GET /api/admin/staff` - Get all staff
- `POST /api/admin/staff` - Add new staff
- `PUT /api/admin/staff/:id` - Update staff
- `DELETE /api/admin/staff/:id` - Delete staff
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `POST /api/admin/students/bulk-import` - Import students via CSV

### Staff Routes

- `GET /api/staff/students` - Get assigned students
- `POST /api/staff/attendance` - Mark attendance
- `GET /api/staff/attendance` - Get attendance records
- `GET /api/staff/dashboard/stats` - Get staff dashboard stats

### Reports

- `GET /api/reports/student/:studentId/pdf` - Download student attendance PDF
- `GET /api/reports/class/:classId/pdf` - Download class attendance PDF

### Notifications

- `POST /api/notifications/send-sms` - Send SMS notification
- `POST /api/notifications/send-whatsapp` - Send WhatsApp notification

## Features in Detail

### Attendance Workflow

1. Staff logs in and sees their assigned classes
2. Selects date and period (1-8)
3. Views student list with checkboxes (all marked present by default)
4. Marks absent students
5. Submits attendance
6. System automatically sends SMS + WhatsApp to parents of absent students
7. Real-time updates via Socket.io

### SMS/WhatsApp Message Format

```
Alert: Your son/daughter [Student Name] (Roll No: [RollNo]) was marked ABSENT
in Period [Period] on [Date].
- [College Name]
```

### PDF Reports

- Individual student attendance reports
- Class-wise attendance reports
- Date range filtering
- Attendance percentage calculations

### Security Features

- JWT-based authentication
- Role-based access control (Admin/Staff)
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers

## Database Schema

### Students Collection

```javascript
{
  name: String,
  email: String (unique),
  rollNo: String (unique),
  department: String,
  year: String,
  address: String,
  batch: String,
  semester: String,
  parentPhone: String
}
```

### Staff Collection

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  address: String,
  department: String,
  yearTaught: [String],
  subjects: [String],
  role: 'staff'
}
```

### Attendance Collection

```javascript
{
  studentId: ObjectId (ref: Students),
  staffId: ObjectId (ref: Staff),
  date: Date,
  period: Number (1-8),
  status: String ('Present'/'Absent'),
  timestamp: Date
}
```

### Admin Collection

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'admin'
}
```

## Testing

### Test SMS/WhatsApp Integration

The application includes a test mode for SMS/WhatsApp. When marking attendance:

- Logs will show notification details in console
- In production, actual SMS/WhatsApp will be sent via Twilio

### Dummy Data

Run the seed script to populate the database with test data:

```bash
cd server
npm run seed
```

## Deployment

### Backend (Node.js)

- Deploy to Heroku, Railway, or DigitalOcean
- Set environment variables
- Ensure MongoDB Atlas is configured

### Frontend (React)

- Build: `npm run build`
- Deploy to Vercel, Netlify, or serve via Express

### Environment Variables

Update all URLs and credentials for production environment.

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access (if using Atlas)

### Twilio Issues

- Verify account credentials
- Check phone number format (+1234567890)
- Ensure account has sufficient credits

### CORS Errors

- Update `CLIENT_URL` in server `.env`
- Check CORS configuration in `server.js`

## Future Enhancements

- Mobile app (React Native)
- Biometric attendance
- Face recognition integration
- Advanced analytics dashboard
- Email notifications
- Multi-language support
- Automated backup system

## License

MIT License

## Support

For issues and questions, please contact the development team.
