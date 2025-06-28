console.log('🚀 Iniciando servidor minimal...');

const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`📥 Requisição recebida: ${req.method} ${req.url}`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Gateway NFe Minimal funcionando',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
});

const PORT = 3002;

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Servidor minimal rodando em http://127.0.0.1:${PORT}`);
  console.log(`🔍 Teste: curl http://127.0.0.1:${PORT}/status`);
});

server.on('error', (err) => {
  console.error('❌ Erro no servidor:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso`);
  }
});

// Manter o processo vivo
process.on('SIGINT', () => {
  console.log('\n🛑 Parando servidor...');
  server.close(() => {
    console.log('✅ Servidor parado');
    process.exit(0);
  });
});

console.log('🎯 Servidor configurado, aguardando conexões...'); 