@echo off
title Alzheimer's Detection App Launcher
echo ======================================
echo Starting Alzheimer's Detection Application
echo ======================================
echo.

REM Set directories
set BACKEND_DIR=%~dp0major-project-backend
set FRONTEND_DIR=%~dp0major-project-frontend

echo Starting backend server (port 5000)...
start "Backend Server" cmd /k "cd /d %BACKEND_DIR% && npm start"

echo Starting frontend server (port 5173)...
start "Frontend Server" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo Application startup initiated!
echo.
echo ███╗   ██╗███████╗██╗   ██╗██████╗  ██████╗ ██╗   ██╗██╗███████╗██╗ ██████╗ ███╗   ██╗
echo ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔═══██╗██║   ██║██║██╔════╝██║██╔═══██╗████╗  ██║
echo ██╔██╗ ██║█████╗  ██║   ██║██████╔╝██║   ██║██║   ██║██║███████╗██║██║   ██║██╔██╗ ██║
echo ██║╚██╗██║██╔══╝  ╚██╗ ██╔╝██╔══██╗██║   ██║╚██╗ ██╔╝██║╚════██║██║██║   ██║██║╚██╗██║
echo ██║ ╚████║███████╗ ╚████╔╝ ██║  ██║╚██████╔╝ ╚████╔╝ ██║███████║██║╚██████╔╝██║ ╚████║
echo ╚═╝  ╚═══╝╚══════╝  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
echo.
echo Backend runs on: http://localhost:5000
echo Frontend runs on: http://localhost:5173
echo.

echo You can close this window. The application servers will keep running.
pause
