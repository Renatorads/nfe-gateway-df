const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  console.log('🏥 Health check recebido');
  res.json({
    status: 'OK',
    message: 'Gateway NFe Test funcionando',
    timestamp: new Date().toISOString()
  });
});

app.post('/emitir-nfe', (req, res) => {
  console.log('📥 Requisição NFe recebida');
  res.json({
    success: true,
    message: 'Teste de comunicação funcionando',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor teste rodando na porta ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
}); 