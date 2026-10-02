@echo off
chcp 65001 >nul
title Kora - publicar
cd /d "%~dp0"
set "PATH=%PATH%;%ProgramFiles%\nodejs;%APPDATA%\npm"
where node >/dev/null 2>/dev/null || (echo.& echo   O Node.js nao foi encontrado. Rode primeiro o 1-instalar-node.bat.& echo.& pause & exit /b 1)
node publicar.js
echo.
pause
