const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Gateway NFe Local funcionando',
    timestamp: new Date().toISOString(),
    versao: 'v1.0-SIMPLE'
  });
});

// Endpoint principal para emissão NFe
app.post('/emitir-nfe', async (req, res) => {
  try {
    console.log('📥 Recebendo requisição para emissão NFe...');
    console.log('📊 Dados recebidos:', JSON.stringify(req.body, null, 2));
    
    const { dadosNfe } = req.body;
    
    if (!dadosNfe) {
      return res.status(400).json({
        success: false,
        message: 'Dados da NFe não fornecidos'
      });
    }
    
    // Validar certificado
    if (!dadosNfe.empresa?.certificado || !dadosNfe.empresa?.senhacertificado) {
      return res.status(400).json({
        success: false,
        message: 'Certificado digital não configurado',
        numeroNota: dadosNfe.numeroNota,
        chaveNfe: dadosNfe.chaveNfe,
        protocolo: null,
        status: 'ERRO',
        codigoSefaz: '999',
        isSimulacao: false,
        comunicacaoDireta: true,
        comunicacaoGateway: false,
        certificadoStatus: 'NAO_CONFIGURADO',
        xmlAssinado: 'NAO',
        versaoGateway: 'v1.0-SIMPLE'
      });
    }
    
    console.log('🏢 Empresa:', dadosNfe.empresa.razaosocial);
    console.log('🔢 Número da nota:', dadosNfe.numeroNota);
    console.log('🌍 Ambiente:', dadosNfe.ambiente);
    console.log('🔐 Certificado disponível:', !!dadosNfe.empresa.certificado);
    
    // SIMULAÇÃO TEMPORÁRIA para testar comunicação
    // TODO: Implementar comunicação real com SEFAZ
    
    const sucesso = Math.random() > 0.3; // 70% de sucesso para teste
    const protocolo = sucesso ? `REC${Date.now()}${Math.floor(Math.random() * 1000)}` : null;
    const codigoSefaz = sucesso ? '100' : '999';
    const mensagem = sucesso ? 'Autorizado o uso da NF-e' : 'Erro na validação dos dados';
    
    console.log(`📊 Resultado simulado: ${sucesso ? 'SUCESSO' : 'ERRO'}`);
    
    res.json({
      success: sucesso,
      message: mensagem,
      numeroNota: dadosNfe.numeroNota,
      chaveNfe: dadosNfe.chaveNfe,
      protocolo: protocolo,
      status: sucesso ? 'AUTORIZADA' : 'ERRO',
      codigoSefaz: codigoSefaz,
      isSimulacao: true, // Temporário
      comunicacaoDireta: true,
      comunicacaoGateway: false,
      certificadoStatus: 'CONFIGURADO',
      xmlAssinado: 'SIM',
      versaoGateway: 'v1.0-SIMPLE',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro na emissão NFe:', error);
    
    res.status(500).json({
      success: false,
      message: `Erro no gateway: ${error.message}`,
      numeroNota: req.body.dadosNfe?.numeroNota,
      chaveNfe: req.body.dadosNfe?.chaveNfe,
      protocolo: null,
      status: 'ERRO',
      codigoSefaz: '999',
      isSimulacao: true,
      comunicacaoDireta: true,
      comunicacaoGateway: false,
      certificadoStatus: 'ERRO',
      xmlAssinado: 'NAO',
      versaoGateway: 'v1.0-SIMPLE',
      erro: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log('🚀 GATEWAY NFe SIMPLES INICIADO');
  console.log('🚀 ========================================');
  console.log(`🌐 Servidor rodando na porta: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📡 Endpoint NFe: http://localhost:${PORT}/emitir-nfe`);
  console.log('⚠️  Modo: TESTE (simulação temporária)');
  console.log('🚀 ========================================');
});

module.exports = app; 