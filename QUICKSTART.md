# 🚀 Quick Start Guide - College Attendance Management System

## Prerequisites Checklist

- ✅ Node.js v16+ installed
- ✅ MongoDB installed (local) OR MongoDB Atlas account
- ✅ Twilio account (optional for SMS/WhatsApp)

## Step 1: Install Server Dependencies

```bash
cd server
npm install
```

## Step 2: Configure Server Environment

Create a `.env` file in the `server` directory:

```bash
cp ../.env.example server/.env
```

Edit `server/.env` with your configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/attendance_system
JWT_SECRET=your_secret_key_min_32_characters_long
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
COLLEGE_NAME=ABC College of Engineering
COLLEGE_SHORT_NAME=ABC College

# Optional: Twilio Configuration (for SMS/WhatsApp)
# TWILIO_ACCOUNT_SID=your_account_sid
# TWILIO_AUTH_TOKEN=your_auth_token
# TWILIO_PHONE_NUMBER=+1234567890
# TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## Step 3: Start MongoDB

### Option A: Local MongoDB

```bash
mongod
```

### Option B: MongoDB Atlas

Update `MONGODB_URI` in `.env` with your Atlas connection string:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance_system
```

## Step 4: Seed the Database

```bash
cd server
npm run seed
```

This will create:

- ✅ 1 Admin account
- ✅ 3 Staff accounts
- ✅ 45 Students (across 3 departments)
- ✅ Sample attendance records

## Step 5: Start the Backend Server

```bash
cd server
npm run dev
```

Server will start on: http://localhost:5000

## Step 6: Install Client Dependencies

Open a new terminal:

```bash
cd client
npm install
```

## Step 7: Start the Frontend

```bash
cd client
npm run dev
```

Frontend will start on: http://localhost:5173

## Step 8: Login and Test

### Admin Login

- URL: http://localhost:5173
- Email: `admin@college.edu`
- Password: `admin123`

### Staff Login

- URL: http://localhost:5173
- Email: `staff1@college.edu`
- Password: `staff123`

## 🎯 Testing the Application

### As Admin:

1. ✅ View dashboard with statistics
2. ✅ Browse students and staff
3. ✅ View attendance reports
4. ✅ Add/Edit/Delete students and staff

### As Staff:

1. ✅ View assigned students
2. ✅ Mark attendance for periods 1-8
3. ✅ View attendance history
4. ✅ Notifications sent to parents (check console logs in test mode)

## 📱 SMS/WhatsApp Testing

### Without Twilio (Test Mode):

- Notifications will be logged to the server console
- Check terminal running `npm run dev` in server folder

### With Twilio:

1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token
3. Get a Twilio phone number
4. Update `.env` with credentials
5. Mark attendance - real SMS/WhatsApp will be sent!

## 🔧 Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:** Start MongoDB with `mongod` command

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:** Change PORT in server/.env or kill process using port 5000

### CORS Error

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:** Ensure CLIENT_URL in server/.env matches your frontend URL

### JWT Secret Warning

```
JWT_SECRET should be at least 32 characters
```

**Solution:** Generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📊 Database Structure

### Collections Created:

- `admins` - Admin users
- `staffs` - Staff/Teachers
- `students` - Student records
- `attendances` - Attendance records

### Sample Data:

- **Departments:** Computer Science, Electronics, Mechanical
- **Years:** 1st Year, 2nd Year, 3rd Year, 4th Year
- **Periods:** 1-8 (hourly periods)

## 🎨 Features to Test

### Admin Features:

- ✅ Dashboard with real-time stats
- ✅ Student management (CRUD)
- ✅ Staff management (CRUD)
- ✅ Attendance overview
- ✅ PDF report generation
- ✅ Bulk student import (CSV)

### Staff Features:

- ✅ View assigned students
- ✅ Mark attendance (period-wise)
- ✅ Automatic SMS/WhatsApp notifications
- ✅ Attendance history
- ✅ PDF reports for their classes

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Password hashing with bcrypt
- ✅ Input validation
- ✅ Rate limiting
- ✅ CORS protection

## 📱 Notification Flow

1. Staff marks attendance
2. System identifies absent students
3. Creates notification message
4. Sends SMS to parent's phone
5. Sends WhatsApp to parent's phone
6. Updates notification status

## 🚀 Production Deployment

### Backend (Heroku/Railway):

```bash
cd server
# Add environment variables in hosting platform
# Deploy
```

### Frontend (Vercel/Netlify):

```bash
cd client
npm run build
# Deploy dist folder
```

### Environment Variables for Production:

- Update `MONGODB_URI` to production database
- Update `CLIENT_URL` to production frontend URL
- Add Twilio credentials
- Generate new `JWT_SECRET`

## 📖 API Documentation

### Authentication Endpoints:

- POST `/api/auth/login-admin` - Admin login
- POST `/api/auth/login-staff` - Staff login
- POST `/api/auth/verify` - Verify token

### Admin Endpoints:

- GET `/api/admin/dashboard/stats` - Dashboard statistics
- GET `/api/admin/students` - List all students
- POST `/api/admin/students` - Create student
- PUT `/api/admin/students/:id` - Update student
- DELETE `/api/admin/students/:id` - Delete student
- GET `/api/admin/staff` - List all staff
- POST `/api/admin/staff` - Create staff

### Staff Endpoints:

- GET `/api/staff/dashboard/stats` - Staff dashboard
- GET `/api/staff/students` - Get assigned students
- POST `/api/staff/attendance` - Mark attendance
- GET `/api/staff/attendance` - Get attendance records

### Report Endpoints:

- GET `/api/reports/student/:id/pdf` - Student report PDF
- GET `/api/reports/class/pdf` - Class report PDF
- GET `/api/reports/date/:date/pdf` - Date-wise report PDF

## 💡 Tips

1. **First Time Setup:** Run `npm run seed` to populate database
2. **Reset Database:** Delete database and run seed again
3. **Test Notifications:** Use your own phone number in student records
4. **Development:** Keep both terminals open (server + client)
5. **Production:** Build client and serve via Express or separate hosting

## 🆘 Support

For issues:

1. Check console logs (browser + server terminal)
2. Verify MongoDB is running
3. Check .env configuration
4. Ensure all dependencies are installed

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ Login page loads at http://localhost:5173
- ✅ Can login as admin/staff
- ✅ Dashboard shows statistics
- ✅ Can view students/staff lists
- ✅ Can mark attendance
- ✅ Console shows notification logs (test mode)

---

**Congratulations!** 🎊 Your attendance management system is ready!
