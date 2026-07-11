@echo off
title DocForge AI - Electron Structure Creator

echo ==========================================
echo Creating Electron Project Structure...
echo ==========================================

REM Navigate to app folder
cd /d "%~dp0app"

REM Create Electron folder
mkdir electron 2>nul

REM Create Electron files
type nul > electron\main.js
type nul > electron\preload.js

echo.
echo ==========================================
echo Electron Structure Created Successfully!
echo ==========================================
echo.

echo Created:
echo   app\
echo   └── electron\
echo       ├── main.js
echo       └── preload.js
echo.

pause