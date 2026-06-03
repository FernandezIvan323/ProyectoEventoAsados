@echo off
title AsamApp - Deteniendo...
echo Cerrando AsamApp...
taskkill /f /fi "WINDOWTITLE eq AsamApp Backend*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq AsamApp Frontend*" >nul 2>&1
echo Listo. AsamApp detenida.
timeout /t 2 /nobreak >nul
