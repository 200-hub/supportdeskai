@echo off
echo Opening Windows Firewall port 8000 for SupportDeskAI backend...
netsh advfirewall firewall add rule name="SupportDeskAI Backend Port 8000" dir=in action=allow protocol=TCP localport=8000
echo.
echo Done! Your phone can now reach the backend.
pause

