@echo off
title DocForge AI - Install UI Dependencies

echo ==========================================
echo Installing UI Dependencies...
echo ==========================================

cd /d "%~dp0..\app"

echo.
echo Installing production packages...
call npm install @mui/material @emotion/react @emotion/styled
call npm install react-icons
call npm install zustand
call npm install react-hook-form
call npm install react-markdown
call npm install react-dropzone
call npm install sonner

echo.
echo Installing development packages...
call npm install -D @types/node

echo.
echo ==========================================
echo UI Dependencies Installed Successfully!
echo ==========================================

pause