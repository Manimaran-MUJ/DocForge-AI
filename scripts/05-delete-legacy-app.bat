@echo off

cd /d "%~dp0.."

if exist app (
    echo Deleting legacy app folder...
    rmdir /s /q app
    echo Legacy app deleted.
) else (
    echo Legacy app folder not found.
)

pause