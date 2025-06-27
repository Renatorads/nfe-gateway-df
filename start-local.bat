@echo off
echo ========================================
echo NFe GATEWAY LOCAL - INICIANDO
echo ========================================
echo.
echo URL: http://localhost:3001
echo Token: nfe-gateway-token-12345
echo.
echo Gateway rodando em background...
echo Pressione qualquer tecla para parar
echo ========================================
echo.

start /B node server.js
pause >nul

echo.
echo Parando gateway...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *"
echo Gateway parado! 