@echo off
title Stopping Alzheimer's Detection Application
echo ======================================
echo Stopping Alzheimer's Detection Application
echo ======================================
echo.

echo Finding and stopping Node.js processes running the application...
echo.

echo Stopping backend server (port 5000)...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :5000 ^| findstr LISTENING') DO (
  echo Terminating process: %%T
  taskkill /F /PID %%T
)

echo Stopping frontend server (port 5173)...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :5173 ^| findstr LISTENING') DO (
  echo Terminating process: %%T
  taskkill /F /PID %%T
)

echo.
echo All application servers have been stopped.
echo.
pause
