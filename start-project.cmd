@echo off
echo ===================================
echo NeuroVision Project Startup Script
echo ===================================
echo.

set "ORIGINAL_DIR=%CD%"

REM Check if Docker is installed
docker --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    set DOCKER_AVAILABLE=1
    echo Docker detected! You can use Docker for deployment.
) else (
    set DOCKER_AVAILABLE=0
    echo Docker not detected. Will use traditional startup method.
)

echo.
echo Choose startup method:
echo 1. Standard (MongoDB + Node.js + React)
echo 2. Docker (if available)
echo.

if %DOCKER_AVAILABLE% == 0 (
    echo Docker is not installed. Using standard startup...
    set CHOICE=1
) else (
    set /P CHOICE="Enter your choice (1 or 2): "
)

if "%CHOICE%"=="2" (
    goto :docker_start
) else (
    goto :standard_start
)

:standard_start
echo.
echo Starting with standard method...
echo.
echo Checking MongoDB status...

REM Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo MongoDB is already running
) else (
    echo Starting MongoDB...
    REM Try to start MongoDB as a service first
    net start MongoDB 2>NUL
    if errorlevel 1 (
        echo MongoDB service not found, starting manually...
        start /B "MongoDB" "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
        timeout /t 5
    )
)

echo.
echo Starting backend server...
cd /d "%ORIGINAL_DIR%\major-project-backend"
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    if errorlevel 1 (
        echo Error installing Python dependencies
        popd
        cd "%ORIGINAL_DIR%"
        pause
        exit /b 1
    )
    popd
)
start cmd /k "npm run dev"

cd "%ORIGINAL_DIR%"
echo.
echo Starting frontend application...
cd /d "%ORIGINAL_DIR%\major-project-frontend"
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo Error installing frontend dependencies
        cd "%ORIGINAL_DIR%"
        pause
        exit /b 1
    )
)

start cmd /k "npm run dev"

cd "%ORIGINAL_DIR%"
echo.
echo Project is starting up! Please wait...
echo Backend will be available at: http://localhost:5000 (or next available port)
echo Frontend will be available at: http://localhost:5173 (or next available port)

goto :end

:docker_start
echo.
echo Starting with Docker...
cd /d "%ORIGINAL_DIR%"

if not exist ".env" (
    echo Creating default .env file...
    echo MONGO_USERNAME=neurovision_user> .env
    echo MONGO_PASSWORD=password123>> .env
    echo JWT_SECRET=neurovision_secret_key>> .env
    echo NODE_ENV=development>> .env
    echo.
    echo Created .env file with default values.
    echo You may want to edit this file to use secure values.
)

echo Building and starting containers...
docker-compose up -d --build

if errorlevel 1 (
    echo Error starting Docker containers
    echo Make sure Docker is running and ports 3000, 5000, and 27017 are available
) else (
    echo.
    echo Docker containers started successfully!
    echo Frontend will be available at: http://localhost:3000
    echo Backend API will be available at: http://localhost:5000
)

:end
cd /d "%ORIGINAL_DIR%"
echo.
echo ===================================
echo Press any key to close this window...
pause > nul
