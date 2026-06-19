@echo off
title AsamApp - Servicios

echo ========================================
echo   Iniciando AsamApp
echo ========================================
echo.

echo [1/2] Iniciando backend (puerto 3000)...
start "AsamApp-Backend" cmd /c "cd /d "%~dp0backend" && node server.js"
if errorlevel 1 (
    echo ERROR: No se pudo iniciar el backend
    pause
    exit /b 1
)
timeout /t 3 /nobreak >nul

echo [2/2] Iniciando frontend (puerto 5173)...
start "AsamApp-Frontend" cmd /c "cd /d "%~dp0frontend" && npx vite dev --host"
if errorlevel 1 (
    echo ERROR: No se pudo iniciar el frontend
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Cerra esta ventana para detener ambos servicios.
echo.
pause
