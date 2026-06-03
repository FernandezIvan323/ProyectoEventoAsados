@echo off
cd /d "%~dp0"
echo Iniciando AsamApp...
start "AsamApp Backend" cmd /k "cd backend && node server.js"
timeout /t 3 /nobreak >nul
start "AsamApp Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo AsamApp iniciado correctamente:
echo   Landing:  http://localhost:5173/
echo   App:      http://localhost:5173/app/login
echo   Backend:  http://localhost:3000/
echo.
echo Cerra las ventanas del backend o frontend para detenerlos.
pause
