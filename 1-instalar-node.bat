@echo off
chcp 65001 >nul
title Kora - instalar Node.js
echo.
echo   Instalando o Node.js (versao LTS)...
echo   Se o Windows pedir permissao, clique em Sim.
echo.
where node >/dev/null 2>/dev/null && (echo   O Node.js ja esta instalado:& node --version & goto fim)
winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
if errorlevel 1 (echo.& echo   Nao consegui instalar pelo winget. Baixe em https://nodejs.org e instale a versao LTS.& goto fim)
echo.
echo   Pronto! Node.js instalado.
:fim
echo.
echo   Pode fechar esta janela e abrir o arquivo 2-publicar.bat
pause
