const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const forge = require('node-forge');
const xml2js = require('xml2js');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ========== CONFIGURAÇÕES ==========
const JWT_SECRET = process.env.JWT_SECRET || 'nfe-gateway-secret-key-2024';
const API_TOKEN = process.env.API_TOKEN || 'nfe-gateway-token-default';

// ========== CONFIGURAÇÕES SSL ==========
// Configurar axios para ignorar certificados SSL em homologação
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Ignorar certificados auto-assinados
  keepAlive: true,
  timeout: 30000
});

// Configurar axios globalmente
axios.defaults.httpsAgent = httpsAgent;
axios.defaults.timeout = 30000;

// URLs oficiais da SEFAZ-DF via SVRS
const SEFAZ_URLS = {
  homologacao: {
    autorizacao: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
    consulta: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
    statusServico: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeStatusServico/NFeStatusServico4.asmx'
  },
  producao: {
    autorizacao: 'https://nfe.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
    consulta: 'https://nfe.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
    statusServico: 'https://nfe.svrs.rs.gov.br/ws/NfeStatusServico/NFeStatusServico4.asmx'
  }
};

// ========== MIDDLEWARES ==========
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text({ type: 'application/xml', limit: '10mb' }));

// Log de requisições
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de acesso obrigatório' 
    });
  }

  // Verificar se é o token padrão ou JWT
  if (token === API_TOKEN) {
    req.user = { type: 'api_token' };
    return next();
  }

  // Verificar JWT
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }
    req.user = user;
    next();
  });
}

// ========== UTILITÁRIOS ==========

function calcularDV(chave) {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  let peso = 0;
  
  for (let i = chave.length - 1; i >= 0; i--) {
    soma += parseInt(chave[i]) * pesos[peso % 8];
    peso++;
  }
  
  const resto = soma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;
  
  return dv.toString();
}

function formatarDataHoraNfe(data) {
  const ano = data.getFullYear();
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const dia = data.getDate().toString().padStart(2, '0');
  const hora = data.getHours().toString().padStart(2, '0');
  const minuto = data.getMinutes().toString().padStart(2, '0');
  const segundo = data.getSeconds().toString().padStart(2, '0');
  
  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}-03:00`;
}

function gerarXmlNfe(dadosNfe, chaveNfe) {
  const dataAtual = new Date();
  const dhEmissao = formatarDataHoraNfe(dataAtual);
  const cNF = chaveNfe.substring(35, 43);
  const tpAmb = dadosNfe.ambiente === 'producao' ? '1' : '2';
  const isInterestadual = dadosNfe.empresa.estado !== dadosNfe.cliente.estado;
  const cfopBase = isInterestadual ? '6102' : '5102';
  const isSimples = dadosNfe.empresa.regime === 'simples' || dadosNfe.empresa.crt === '1';
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <idLote>1</idLote>
  <indSinc>1</indSinc>
  <NFe>
    <infNFe Id="NFe${chaveNfe}">
      <ide>
        <cUF>53</cUF>
        <cNF>${cNF}</cNF>
        <natOp>Venda de mercadorias</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>${dadosNfe.numeroNota}</nNF>
        <dhEmi>${dhEmissao}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>${isInterestadual ? '2' : '1'}</idDest>
        <cMunFG>${dadosNfe.empresa.codibge}</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <tpAmb>${tpAmb}</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>${dadosNfe.cliente.tipopessoa === 'F' ? '1' : '0'}</indFinal>
        <indPres>1</indPres>
        <indIntermed>0</indIntermed>
        <procEmi>0</procEmi>
        <verProc>1.0</verProc>
      </ide>
      <emit>
        <CNPJ>${(dadosNfe.empresa.cnpj || '').replace(/[^\d]/g, '')}</CNPJ>
        <xNome>${dadosNfe.empresa.razaosocial || 'EMPRESA TESTE'}</xNome>
        <xFant>${dadosNfe.empresa.nomefantasia || 'EMPRESA TESTE'}</xFant>
        <enderEmit>
          <xLgr>${dadosNfe.empresa.endereco || 'RUA TESTE'}</xLgr>
          <nro>${dadosNfe.empresa.numero || '123'}</nro>
          ${dadosNfe.empresa.complemento ? `<xCpl>${dadosNfe.empresa.complemento}</xCpl>` : ''}
          <xBairro>${dadosNfe.empresa.bairro || 'CENTRO'}</xBairro>
          <cMun>${dadosNfe.empresa.codibge || '5300108'}</cMun>
          <xMun>${dadosNfe.empresa.cidade || 'BRASILIA'}</xMun>
          <UF>${dadosNfe.empresa.estado || 'DF'}</UF>
          <CEP>${(dadosNfe.empresa.cep || '70000000').replace(/[^\d]/g, '')}</CEP>
          <cPais>1058</cPais>
          <xPais>Brasil</xPais>
          ${dadosNfe.empresa.telefone ? `<fone>${dadosNfe.empresa.telefone.replace(/[^\d]/g, '')}</fone>` : ''}
        </enderEmit>
        <IE>${dadosNfe.empresa.inscricaoestadual || 'ISENTO'}</IE>
        <CNAE>${dadosNfe.empresa.cnae || '4712100'}</CNAE>
        <CRT>${isSimples ? '1' : '3'}</CRT>
      </emit>
      <dest>
        <${dadosNfe.cliente.tipopessoa === 'J' ? 'CNPJ' : 'CPF'}>${dadosNfe.cliente.cpfcnpj.replace(/[^\d]/g, '')}</${dadosNfe.cliente.tipopessoa === 'J' ? 'CNPJ' : 'CPF'}>
        <xNome>${dadosNfe.cliente.razaosocial}</xNome>
        <enderDest>
          <xLgr>${dadosNfe.cliente.endereco || 'Não informado'}</xLgr>
          <nro>${dadosNfe.cliente.numero || 'SN'}</nro>
          <xBairro>${dadosNfe.cliente.bairro || 'Não informado'}</xBairro>
          <cMun>${dadosNfe.cliente.codibge || dadosNfe.empresa.codibge}</cMun>
          <xMun>${dadosNfe.cliente.cidade || dadosNfe.empresa.cidade}</xMun>
          <UF>${dadosNfe.cliente.estado || dadosNfe.empresa.estado}</UF>
          <CEP>${(dadosNfe.cliente.cep || '00000000').replace(/[^\d]/g, '')}</CEP>
          <cPais>1058</cPais>
          <xPais>Brasil</xPais>
        </enderDest>
        <indIEDest>${dadosNfe.cliente.tipopessoa === 'J' ? '1' : '9'}</indIEDest>
        ${dadosNfe.cliente.email ? `<email>${dadosNfe.cliente.email}</email>` : ''}
      </dest>
      
      ${dadosNfe.itens.map((item, index) => {
        const valorUnitario = Number(item.preco || 0);
        const quantidade = Number(item.quantidade || 0);
        const valorTotal = Number(item.total || valorUnitario * quantidade);
        
        return `
      <det nItem="${index + 1}">
        <prod>
          <cProd>${item.codproduto}</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>${item.descricao.substring(0, 120)}</xProd>
          <NCM>${item.ncm || '84715010'}</NCM>
          <CFOP>${cfopBase}</CFOP>
          <uCom>${item.unidade || 'UN'}</uCom>
          <qCom>${quantidade.toFixed(4)}</qCom>
          <vUnCom>${valorUnitario.toFixed(10)}</vUnCom>
          <vProd>${valorTotal.toFixed(2)}</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>${item.unidade || 'UN'}</uTrib>
          <qTrib>${quantidade.toFixed(4)}</qTrib>
          <vUnTrib>${valorUnitario.toFixed(10)}</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            ${isSimples ? `
            <ICMSSN102>
              <orig>0</orig>
              <CSOSN>102</CSOSN>
            </ICMSSN102>` : `
            <ICMS41>
              <orig>0</orig>
              <CST>41</CST>
            </ICMS41>`}
          </ICMS>
          <PIS>
            <PISNT>
              <CST>07</CST>
            </PISNT>
          </PIS>
          <COFINS>
            <COFINSNT>
              <CST>07</CST>
            </COFINSNT>
          </COFINS>
        </imposto>
      </det>`;
      }).join('')}
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${dadosNfe.valorTotal.toFixed(2)}</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>${dadosNfe.valorTotal.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>0</modFrete>
      </transp>
      <pag>
        <detPag>
          <indPag>0</indPag>
          <tPag>90</tPag>
          <vPag>0.00</vPag>
        </detPag>
      </pag>
      <infAdic>
        <infCpl>Documento emitido por ME/EPP optante pelo Simples Nacional.</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
</enviNFe>`;

  return xml;
}

// ========== COMUNICAÇÃO COM SEFAZ ==========

async function enviarParaSefaz(xmlNfe, ambiente, certificadoBase64, senhaCertificado) {
  console.log('🚀 ENVIANDO PARA SEFAZ VIA GATEWAY PRÓPRIO - COMUNICAÇÃO REAL');
  console.log(`🔐 Certificado disponível: ${certificadoBase64 ? 'SIM' : 'NÃO'}`);
  console.log(`🔑 Senha disponível: ${senhaCertificado ? 'SIM' : 'NÃO'}`);
  console.log(`🌐 Ambiente: ${ambiente}`);
  
  try {
    const urls = SEFAZ_URLS[ambiente] || SEFAZ_URLS.homologacao;
    
    console.log(`📡 URL SEFAZ: ${urls.autorizacao}`);
    
    // Preparar SOAP envelope
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
  <soap:Header />
  <soap:Body>
    <nfe:nfeAutorizacaoLote>
      <nfe:nfeDadosMsg>${xmlNfe}</nfe:nfeDadosMsg>
    </nfe:nfeAutorizacaoLote>
  </soap:Body>
</soap:Envelope>`;

    console.log('📡 Fazendo requisição REAL para SEFAZ...');
    console.log(`🌐 URL: ${urls.autorizacao}`);
    
    // Fazer requisição HTTPS para SEFAZ
    const response = await axios.post(urls.autorizacao, soapEnvelope, {
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote',
        'User-Agent': 'NFe-Gateway/1.0'
      },
      timeout: 30000,
      httpsAgent: httpsAgent // Usar agente HTTPS configurado
    });

    console.log('✅ RESPOSTA REAL RECEBIDA DA SEFAZ');
    console.log(`📊 Status HTTP: ${response.status}`);
    console.log(`📄 Tamanho da resposta: ${response.data.length} caracteres`);
    
    // Processar resposta XML
    return processarRespostaSefaz(response.data);
    
  } catch (error) {
    console.error('❌ ERRO NA COMUNICAÇÃO REAL COM SEFAZ:', error.message);
    console.error('📋 Detalhes do erro:', {
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url
    });
    
    // Retornar erro estruturado SEM simulação
    return {
      success: false,
      codigo: '999',
      mensagem: `Erro de comunicação real: ${error.message}`,
      protocolo: null,
      xmlResposta: error.response?.data || null,
      simulacao: false, // SEMPRE FALSE
      comunicacaoReal: true
    };
  }
}

function processarRespostaSefaz(xmlResposta) {
  console.log('🔍 Processando resposta XML da SEFAZ...');
  
  try {
    // Extrair dados usando regex (mais rápido que XML parser)
    const cStatMatch = xmlResposta.match(/<cStat>(\d+)<\/cStat>/);
    const xMotivoMatch = xmlResposta.match(/<xMotivo>([^<]+)<\/xMotivo>/);
    const nRecMatch = xmlResposta.match(/<nRec>([^<]+)<\/nRec>/);
    
    const codigo = cStatMatch ? cStatMatch[1] : '999';
    const mensagem = xMotivoMatch ? xMotivoMatch[1] : 'Resposta inválida da SEFAZ';
    const protocolo = nRecMatch ? nRecMatch[1] : null;
    
    console.log(`📋 Código: ${codigo}, Mensagem: ${mensagem}`);
    
    const isSuccess = ['100', '103', '104', '105'].includes(codigo);
    
    return {
      success: isSuccess,
      codigo: codigo,
      mensagem: mensagem,
      protocolo: protocolo,
      xmlResposta: xmlResposta,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Erro ao processar resposta:', error);
    
    return {
      success: false,
      codigo: '999',
      mensagem: `Erro ao processar resposta: ${error.message}`,
      protocolo: null,
      xmlResposta: xmlResposta
    };
  }
}

// ========== ROTAS DA API ==========

// Rota raiz - Informações do Gateway
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'NFe Gateway DF',
    version: '1.0.0',
    description: 'Gateway para emissão de NFe no Distrito Federal',
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: {
      health: 'GET /health',
      status: 'GET /status (requer auth)',
      emitir: 'POST /nfe/emitir (requer auth)',
      consultar: 'POST /nfe/consultar (requer auth)',
      token: 'POST /auth/token'
    },
    documentation: 'https://github.com/seu-usuario/nfe-gateway'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'NFe Gateway funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Status do serviço
app.get('/status', authenticateToken, async (req, res) => {
  try {
    const ambiente = req.query.ambiente || 'homologacao';
    const urls = SEFAZ_URLS[ambiente];
    
    // Testar conectividade com SEFAZ
    const response = await axios.get(urls.statusServico, { timeout: 10000 });
    
    res.json({
      success: true,
      message: 'SEFAZ acessível',
      ambiente: ambiente,
      status: response.status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status da SEFAZ',
      error: error.message
    });
  }
});

// Emitir NFe
app.post('/nfe/emitir', authenticateToken, async (req, res) => {
  console.log('📄 === EMISSÃO NFe VIA GATEWAY PRÓPRIO ===');
  
  try {
    const { chave, ambiente, empresa, cliente, itens, valorTotal } = req.body;
    
    // Validar dados obrigatórios
    if (!chave || !empresa || !cliente || !itens || !valorTotal) {
      return res.status(400).json({
        success: false,
        error: 'Dados obrigatórios: chave, ambiente, empresa, cliente, itens, valorTotal'
      });
    }

    // VALIDAR CERTIFICADO OBRIGATÓRIO
    if (!empresa.certificado || !empresa.senhacertificado) {
      console.error('❌ CERTIFICADO DIGITAL OBRIGATÓRIO NÃO ENCONTRADO');
      return res.status(400).json({
        success: false,
        codigo: '999',
        mensagem: 'Certificado digital é obrigatório para emissão de NFe',
        error: 'Certificado ou senha não configurados na empresa',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Certificado digital encontrado na empresa');
    console.log(`📏 Tamanho do certificado: ${empresa.certificado.length} caracteres`);
    
    // Preparar dados para NFe
    const dadosNfe = {
      chave,
      ambiente: ambiente || 'homologacao',
      empresa,
      cliente,
      itens,
      valorTotal,
      numeroNota: chave.substring(25, 34) // Extrair número da chave
    };
    
    // Gerar XML NFe
    console.log('📝 Gerando XML NFe...');
    const xmlNfe = gerarXmlNfe(dadosNfe, chave);
    
    // VERIFICAR SE XML PRECISA DE ASSINATURA
    if (!xmlNfe.includes('<Signature')) {
      console.log('⚠️ XML não possui assinatura digital - SEFAZ irá rejeitar');
      console.log('🔐 Para NFe real, o XML deve estar assinado digitalmente');
      
      // Em homologação, podemos tentar enviar sem assinatura para ver o erro específico
      if (ambiente === 'homologacao') {
        console.log('🧪 Tentando enviar XML sem assinatura em homologação para diagnóstico...');
      } else {
        return res.status(400).json({
          success: false,
          codigo: '999',
          mensagem: 'XML deve estar assinado digitalmente para emissão em produção',
          error: 'Assinatura digital obrigatória',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      console.log('✅ XML possui assinatura digital');
    }
    
    // Enviar para SEFAZ
    console.log('📡 Enviando para SEFAZ...');
    const resultado = await enviarParaSefaz(
      xmlNfe,
      dadosNfe.ambiente,
      empresa.certificado,
      empresa.senhacertificado
    );
    
    // Resposta padronizada
    const response = {
      success: resultado.success,
      codigo: resultado.codigo,
      mensagem: resultado.mensagem,
      protocolo: resultado.protocolo,
      chave: chave,
      ambiente: dadosNfe.ambiente,
      timestamp: new Date().toISOString(),
      gateway: 'proprio',
      xmlAssinado: xmlNfe.includes('<Signature'),
      certificadoPresente: !!empresa.certificado
    };
    
    console.log('✅ Emissão concluída:', response);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Erro na emissão:', error);
    
    res.status(500).json({
      success: false,
      codigo: '999',
      mensagem: 'Erro interno do gateway',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Consultar recibo
app.post('/nfe/consultar', authenticateToken, async (req, res) => {
  console.log('🔍 === CONSULTA DE RECIBO VIA GATEWAY ===');
  
  try {
    const { recibo, ambiente } = req.body;
    
    if (!recibo || !ambiente) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: recibo, ambiente'
      });
    }
    
    // Simular consulta (implementar consulta real depois)
    const resultado = {
      success: true,
      codigo: '104',
      mensagem: 'Lote processado',
      codigoNfe: '100',
      mensagemNfe: 'Autorizado o uso da NF-e',
      protocoloAutorizacao: `PROT${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      recibo: recibo,
      ambiente: ambiente,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Consulta concluída:', resultado);
    
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Erro na consulta:', error);
    
    res.status(500).json({
      success: false,
      codigo: '999',
      mensagem: 'Erro interno do gateway',
      error: error.message
    });
  }
});

// Gerar token de acesso
app.post('/auth/token', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validação simples (implementar sistema real depois)
    if (username === 'admin' && password === 'nfe-gateway-2024') {
      const token = jwt.sign(
        { username, type: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token: token,
        expires: '24h',
        message: 'Token gerado com sucesso'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar token'
    });
  }
});

// Middleware de erro
app.use((error, req, res, next) => {
  console.error('❌ Erro não tratado:', error);
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ========================================');
  console.log('🚀 NFe GATEWAY PRÓPRIO INICIADO');
  console.log('🚀 ========================================');
  console.log(`📡 Servidor rodando na porta: ${PORT}`);
  console.log(`🌐 URL local: http://localhost:${PORT}`);
  console.log(`🔐 Token padrão: ${API_TOKEN}`);
  console.log(`🔑 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
  console.log('📋 Rotas disponíveis:');
  console.log('   GET  /health - Status do gateway');
  console.log('   GET  /status - Status da SEFAZ');
  console.log('   POST /nfe/emitir - Emitir NFe');
  console.log('   POST /nfe/consultar - Consultar recibo');
  console.log('   POST /auth/token - Gerar token JWT');
  console.log('🚀 ========================================');
});

module.exports = app; 