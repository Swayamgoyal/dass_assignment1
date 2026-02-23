@echo off
echo Installing backend dependencies...
cd /d "%~dp0backend"
call npm install
echo.
echo Backend dependencies installed!
echo.
pause
