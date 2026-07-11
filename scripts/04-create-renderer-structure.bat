@echo off
title DocForge AI - Renderer Structure

echo ===========================================
echo Creating Renderer Structure...
echo ===========================================

cd /d "%~dp0..\desktop\src\renderer\src"

mkdir hooks 2>nul
mkdir layouts 2>nul
mkdir pages 2>nul
mkdir services 2>nul
mkdir store 2>nul
mkdir styles 2>nul
mkdir types 2>nul
mkdir utils 2>nul

mkdir components\common 2>nul
mkdir components\home 2>nul

mkdir components\common\Header 2>nul
mkdir components\home\FilePicker 2>nul
mkdir components\home\OptionPanel 2>nul
mkdir components\home\ConvertButton 2>nul
mkdir components\home\StatusBar 2>nul

mkdir pages\Home 2>nul

echo.
echo ===========================================
echo Renderer Structure Created Successfully
echo ===========================================

pause