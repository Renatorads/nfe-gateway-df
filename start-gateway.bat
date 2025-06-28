@echo off
echo ========================================
echo INICIANDO GATEWAY NFe LOCAL
echo ========================================
echo.
echo Verificando dependencias...
if not exist node_modules (
    echo Instalando dependencias...
    npm install
)
echo.
echo Iniciando servidor...
echo URL: http://localhost:3001
echo Health Check: http://localhost:3001/health
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
npm start 