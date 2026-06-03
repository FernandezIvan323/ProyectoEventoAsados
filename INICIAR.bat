@echo off
title AsamApp - Iniciando...
echo.
echo  ==========================================
echo   AsamApp - Iniciando el sistema...
echo  ==========================================
echo.

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js no esta instalado.
    echo  Descargalo desde: https://nodejs.org
    echo  Instala la version LTS y vuelve a ejecutar este archivo.
    pause
    exit /b 1
)

echo  [1/4] Instalando dependencias del backend...
cd backend
if not exist node_modules (
    call npm install --silent
)

echo  [2/4] Configurando base de datos...
if not exist .env (
    copy .env.example .env >nul
)
call npx prisma migrate deploy --schema=prisma/schema.prisma >nul 2>&1

echo  [3/4] Instalando dependencias del frontend...
cd ..\frontend
if not exist node_modules (
    call npm install --silent
)
if not exist .env (
    copy .env.example .env >nul
)

echo  [4/4] Iniciando servidores...
cd ..

start "AsamApp Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "AsamApp Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 4 /nobreak >nul

echo.
echo  ==========================================
echo   Abriendo AsamApp en el navegador...
echo  ==========================================
echo.
start http://localhost:5173

echo  Landing: http://localhost:5173
echo  App:     http://localhost:5173/app
echo.
echo  Para cerrar la app, cerra las ventanas de terminal.
pause
