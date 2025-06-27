@echo off
echo ========================================
echo NFe GATEWAY - INSTALACAO AUTOMATICA
echo ========================================
echo.

echo 1. Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Baixe em: https://nodejs.org
    pause
    exit /b 1
)

echo.
echo 2. Instalando dependencias...
npm install

echo.
echo 3. Testando instalacao...
echo const { spawn } = require('child_process'); > test-install.js
echo const server = spawn('node', ['server.js']); >> test-install.js
echo setTimeout(() => { server.kill(); console.log('Instalacao OK!'); }, 3000); >> test-install.js
node test-install.js
del test-install.js

echo.
echo ========================================
echo INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Para iniciar o gateway:
echo   npm start
echo.
echo Para testar:
echo   npm test
echo.
echo URL local: http://localhost:3001
echo Token: nfe-gateway-token-12345
echo.
pause 