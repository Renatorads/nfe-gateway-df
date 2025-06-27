// Configurações do NFe Gateway
module.exports = {
  // Servidor
  port: process.env.PORT || 3001,
  host: process.env.HOST || '0.0.0.0',
  
  // Segurança
  jwtSecret: process.env.JWT_SECRET || 'nfe-gateway-secret-key-super-secure-2024',
  apiToken: process.env.API_TOKEN || 'nfe-gateway-token-12345',
  
  // SEFAZ
  defaultAmbiente: process.env.DEFAULT_AMBIENTE || 'homologacao',
  
  // Timeouts
  sefazTimeout: 30000,
  requestTimeout: 60000,
  
  // Logs
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Credenciais padrão (MUDE EM PRODUÇÃO)
  defaultCredentials: {
    username: 'admin',
    password: 'nfe-gateway-2024'
  }
}; 