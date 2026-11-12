@echo off
rem Double-click to stop SupportDesk AI's database, API and app server.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop.ps1"
echo.
pause
