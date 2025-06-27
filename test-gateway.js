const axios = require('axios');

// Configurações do teste
const GATEWAY_URL = 'http://localhost:3001';
const API_TOKEN = 'nfe-gateway-token-12345';

// Dados de teste
const dadosTestNFe = {
  chave: '53202460886521000110550010000000011234567890',
  ambiente: 'homologacao',
  empresa: {
    cnpj: '60.886.521/0001-10',
    razaosocial: 'EMPRESA TESTE LTDA',
    nomefantasia: 'EMPRESA TESTE',
    endereco: 'RUA TESTE, 123',
    numero: '123',
    bairro: 'CENTRO',
    cidade: 'BRASILIA',
    estado: 'DF',
    cep: '70000-000',
    codibge: '5300108',
    inscricaoestadual: '0123456789',
    cnae: '4712100',
    regime: 'simples',
    crt: '1'
  },
  cliente: {
    cpfcnpj: '12345678901',
    razaosocial: 'CLIENTE TESTE',
    tipopessoa: 'F',
    endereco: 'RUA CLIENTE, 456',
    numero: '456',
    bairro: 'CENTRO',
    cidade: 'BRASILIA',
    estado: 'DF',
    cep: '70000-001',
    codibge: '5300108'
  },
  itens: [
    {
      codproduto: 'PROD001',
      descricao: 'PRODUTO TESTE',
      quantidade: 1,
      preco: 100.00,
      total: 100.00,
      unidade: 'UN',
      ncm: '84715010'
    }
  ],
  valorTotal: 100.00
};

async function testarGateway() {
  console.log('🧪 ========================================');
  console.log('🧪 TESTANDO NFe GATEWAY PRÓPRIO');
  console.log('🧪 ========================================');
  
  try {
    // Teste 1: Health check
    console.log('\n1️⃣ Testando health check...');
    const healthResponse = await axios.get(`${GATEWAY_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Teste 2: Status da SEFAZ
    console.log('\n2️⃣ Testando status da SEFAZ...');
    const statusResponse = await axios.get(`${GATEWAY_URL}/status`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      },
      params: {
        ambiente: 'homologacao'
      }
    });
    console.log('✅ Status SEFAZ:', statusResponse.data);
    
    // Teste 3: Emissão de NFe
    console.log('\n3️⃣ Testando emissão de NFe...');
    const emissaoResponse = await axios.post(`${GATEWAY_URL}/nfe/emitir`, dadosTestNFe, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Emissão NFe:', emissaoResponse.data);
    
    // Teste 4: Consulta de recibo
    console.log('\n4️⃣ Testando consulta de recibo...');
    const consultaResponse = await axios.post(`${GATEWAY_URL}/nfe/consultar`, {
      recibo: 'TESTE123456789',
      ambiente: 'homologacao'
    }, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Consulta recibo:', consultaResponse.data);
    
    // Teste 5: Gerar token JWT
    console.log('\n5️⃣ Testando geração de token JWT...');
    const tokenResponse = await axios.post(`${GATEWAY_URL}/auth/token`, {
      username: 'admin',
      password: 'nfe-gateway-2024'
    });
    console.log('✅ Token JWT:', tokenResponse.data);
    
    console.log('\n🎉 ========================================');
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('🎉 Gateway funcionando corretamente');
    console.log('🎉 ========================================');
    
  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ ERRO NO TESTE:');
    console.error('❌ ========================================');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
    
    console.error('\n💡 Verifique se o gateway está rodando:');
    console.error('   npm start');
    console.error('❌ ========================================');
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testarGateway();
}

module.exports = { testarGateway }; 