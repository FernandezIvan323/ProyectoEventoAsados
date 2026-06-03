@echo off
echo Deteniendo servidores de AsamApp...
taskkill /f /im node.exe >nul 2>&1
echo Servidores detenidos.
timeout /t 2 /nobreak >nul