# NFe Gateway Próprio

Gateway NFe gratuito para comunicação real com a SEFAZ. Funciona em produção sem custos de API externa.

## 🚀 Características

- ✅ **Comunicação real com SEFAZ-DF**
- ✅ **Gratuito e sem limitações**
- ✅ **API REST simples**
- ✅ **Autenticação por token**
- ✅ **Pronto para produção**
- ✅ **Hospedagem gratuita**

## 📦 Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Copiar configurações
cp config.js.example config.js

# 3. Iniciar servidor
npm start

# 4. Testar funcionamento
npm test
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
PORT=3001                                    # Porta do servidor
JWT_SECRET=seu-jwt-secret-super-seguro      # Chave JWT
API_TOKEN=seu-api-token-personalizado       # Token de API
DEFAULT_AMBIENTE=homologacao                 # Ambiente padrão
```

### Credenciais Padrão

```
Username: admin
Password: nfe-gateway-2024
Token: nfe-gateway-token-12345
```

**⚠️ IMPORTANTE: Mude as credenciais em produção!**

## 📡 API Endpoints

### 1. Health Check
```http
GET /health
```

### 2. Status da SEFAZ
```http
GET /status?ambiente=homologacao
Authorization: Bearer SEU_TOKEN
```

### 3. Emitir NFe
```http
POST /nfe/emitir
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "chave": "53202460886521000110550010000000011234567890",
  "ambiente": "homologacao",
  "empresa": { ... },
  "cliente": { ... },
  "itens": [ ... ],
  "valorTotal": 100.00
}
```

### 4. Consultar Recibo
```http
POST /nfe/consultar
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "recibo": "123456789",
  "ambiente": "homologacao"
}
```

### 5. Gerar Token JWT
```http
POST /auth/token
Content-Type: application/json

{
  "username": "admin",
  "password": "nfe-gateway-2024"
}
```

## 🌐 Hospedagem Gratuita

### Opção 1: Railway (Recomendado)
1. Acesse: https://railway.app
2. Conecte seu GitHub
3. Deploy automático
4. URL: `https://seu-app.railway.app`

### Opção 2: Render
1. Acesse: https://render.com
2. Conecte repositório
3. Deploy gratuito
4. URL: `https://seu-app.onrender.com`

### Opção 3: Heroku
1. Acesse: https://heroku.com
2. Criar app
3. Deploy via Git
4. URL: `https://seu-app.herokuapp.com`

## 🔐 Configuração no Supabase

Após hospedar, configure no Supabase:

1. **Dashboard Supabase** → **Settings** → **Environment Variables**
2. Adicionar:
   ```
   NFE_GATEWAY_URL = https://seu-gateway.railway.app
   NFE_GATEWAY_TOKEN = nfe-gateway-token-12345
   ```

## 🧪 Teste Local

```bash
# Iniciar gateway
npm start

# Em outro terminal, testar
npm test
```

## 📋 Exemplo de Uso

```javascript
const axios = require('axios');

const gateway = 'https://seu-gateway.railway.app';
const token = 'nfe-gateway-token-12345';

// Emitir NFe
const response = await axios.post(`${gateway}/nfe/emitir`, {
  chave: '53202460886521000110550010000000011234567890',
  ambiente: 'homologacao',
  empresa: { /* dados da empresa */ },
  cliente: { /* dados do cliente */ },
  itens: [ /* itens da NFe */ ],
  valorTotal: 100.00
}, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

console.log('NFe emitida:', response.data);
```

## 🛡️ Segurança

- ✅ Autenticação por token
- ✅ CORS configurado
- ✅ Helmet para segurança
- ✅ Validação de dados
- ✅ Rate limiting (implementar se necessário)

## 🐛 Troubleshooting

### Gateway não inicia
```bash
# Verificar porta em uso
netstat -ano | findstr :3001

# Matar processo
taskkill /PID [PID] /F

# Usar porta diferente
PORT=3002 npm start
```

### Erro de certificado SEFAZ
- Verificar conectividade com internet
- Testar URLs da SEFAZ manualmente
- Verificar firewall/proxy corporativo

### Erro 401 Unauthorized
- Verificar token de autenticação
- Confirmar header Authorization
- Validar credenciais

## 📞 Suporte

- **GitHub Issues:** Para bugs e melhorias
- **Documentação SEFAZ:** Manual de Orientação ao Contribuinte
- **Logs:** Verificar console do servidor

## 📄 Licença

MIT - Uso livre para projetos comerciais e pessoais.

---

**🎯 Gateway NFe próprio - Comunicação real com SEFAZ sem custos!** 