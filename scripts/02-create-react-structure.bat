@echo off
title DocForge AI - React Structure

echo =========================================
echo Creating React Folder Structure...
echo =========================================

cd /d "%~dp0..\app\src"

mkdir components 2>nul
mkdir pages 2>nul
mkdir services 2>nul
mkdir hooks 2>nul
mkdir utils 2>nul
mkdir types 2>nul

mkdir components\Header 2>nul
mkdir components\FilePicker 2>nul
mkdir components\Options 2>nul
mkdir components\StatusBar 2>nul
mkdir components\ConvertButton 2>nul

type nul > components\Header\Header.tsx
type nul > components\FilePicker\FilePicker.tsx
type nul > components\Options\Options.tsx
type nul > components\StatusBar\StatusBar.tsx
type nul > components\ConvertButton\ConvertButton.tsx

mkdir pages\Home 2>nul
type nul > pages\Home\Home.tsx

echo.
echo =========================================
echo React structure created successfully!
echo =========================================

pause