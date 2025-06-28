console.log('🚀 Teste Node.js funcionando!');
console.log('📅 Data:', new Date().toISOString());
console.log('📂 Diretório:', __dirname);
console.log('🔗 Tentando iniciar servidor simples na porta 3002...');

const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Gateway NFe - Teste OK\n');
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Erro no servidor:', err);
}); 