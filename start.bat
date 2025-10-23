@echo off
echo Starting Collaborative Whiteboard Application...
echo.

echo Installing dependencies...
call npm run install-all
if %errorlevel% neq 0 (
    echo Error installing dependencies!
    pause
    exit /b 1
)

echo.
echo Starting servers...
echo Backend server will run on http://localhost:5000
echo Frontend server will run on http://localhost:3000
echo.

call npm run dev

pause
