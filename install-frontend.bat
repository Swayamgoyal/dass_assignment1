@echo off
echo Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
echo.
echo Frontend dependencies installed!
echo.
pause
