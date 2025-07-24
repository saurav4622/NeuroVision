@echo off
title NeuroVision - Setup Dependencies
color 0B

echo.
echo ================================
echo    NeuroVision Setup
echo ================================
echo.

echo Installing Backend Dependencies...
cd major-project-backend
npm install
cd..

echo.
echo Installing Frontend Dependencies...
cd major-project-frontend
npm install
cd..

echo.
echo Installing Python AI Dependencies...
cd major-project-backend\python
pip install -r requirements.txt
cd..\..

echo.
echo Creating Environment Files...

REM Create backend .env if it doesn't exist
if not exist "major-project-backend\.env" (
    echo Creating backend .env file...
    (
        echo MONGODB_URI=mongodb://localhost:27017/neurovision_database
        echo FRONTEND_URL=http://localhost:5173
        echo PORT=5000
        echo JWT_SECRET=REPLACE_WITH_SECURE_RANDOM_SECRET
        echo EMAIL_USER=your-email@gmail.com
        echo EMAIL_PASS=your-gmail-app-password
    ) > "major-project-backend\.env"
    echo IMPORTANT: Configure your database and email settings in backend\.env
)

REM Create frontend .env if it doesn't exist
if not exist "major-project-frontend\.env" (
    echo Creating frontend .env file...
    (
        echo VITE_API_URL=http://localhost:5000
        echo BACKEND_URL=http://localhost:5000
        echo NODE_ENV=development
    ) > "major-project-frontend\.env"
)

echo.
echo ================================
echo    Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Configure backend\.env with your database credentials
echo 2. Run start-application.cmd to start the servers
echo.
pause
