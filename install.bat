@echo off
echo ========================================
echo College Attendance Management System
echo Installation Script
echo ========================================
echo.

echo Step 1: Installing Server Dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Server dependencies installation failed!
    pause
    exit /b 1
)
echo Server dependencies installed successfully!
echo.

echo Step 2: Creating Server .env file...
if not exist .env (
    echo Creating .env from template...
    (
        echo PORT=5000
        echo NODE_ENV=development
        echo MONGODB_URI=mongodb://localhost:27017/attendance_system
        echo JWT_SECRET=attendance_system_super_secret_key_change_in_production_min_32_chars
        echo JWT_EXPIRE=7d
        echo CLIENT_URL=http://localhost:5173
        echo COLLEGE_NAME=Queens College Arts and Science
        echo COLLEGE_SHORT_NAME=Queens College
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
    ) > .env
    echo Server .env file created!
) else (
    echo Server .env file already exists!
)
echo.

cd ..

echo Step 3: Installing Client Dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Client dependencies installation failed!
    pause
    exit /b 1
)
echo Client dependencies installed successfully!
echo.

cd ..

echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Make sure MongoDB is running
echo 2. Seed the database: cd server ^&^& npm run seed
echo 3. Start the server: cd server ^&^& npm run dev
echo 4. Start the client: cd client ^&^& npm run dev
echo 5. Open http://localhost:5173 in your browser
echo.
echo Default Credentials:
echo Admin: admin@queenscollege.edu / admin123
echo Staff: staff1@queenscollege.edu / staff123
echo.
pause
