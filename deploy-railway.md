# Deploy do NFe Gateway no Railway (Gratuito)

## 🚂 Por que Railway?

- ✅ **Hospedagem gratuita** (500 horas/mês)
- ✅ **Deploy automático** via GitHub
- ✅ **HTTPS automático**
- ✅ **Logs em tempo real**
- ✅ **Variáveis de ambiente**
- ✅ **Sem cartão de crédito**

## 📋 Passo a Passo

### 1. Preparar Repositório

```bash
# Criar repositório no GitHub
git init
git add .
git commit -m "NFe Gateway inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/nfe-gateway.git
git push -u origin main
```

### 2. Deploy no Railway

1. **Acesse:** https://railway.app
2. **Login:** com GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Selecione:** seu repositório `nfe-gateway`
5. **Deploy:** automático

### 3. Configurar Variáveis

No painel Railway:

1. **Settings** → **Environment**
2. **Add Variable:**
   ```
   PORT = 3001
   JWT_SECRET = nfe-gateway-super-secret-production-2024
   API_TOKEN = seu-token-personalizado-seguro
   NODE_ENV = production
   ```

### 4. Obter URL

1. **Settings** → **Networking**
2. **Generate Domain**
3. **URL:** `https://seu-app.railway.app`

### 5. Testar Deploy

```bash
# Testar health check
curl https://seu-app.railway.app/health

# Resposta esperada:
{
  "success": true,
  "message": "NFe Gateway funcionando",
  "version": "1.0.0"
}
```

## 🔧 Configuração no Supabase

1. **Dashboard Supabase** → **Settings** → **Environment Variables**
2. **Add Variable:**
   ```
   NFE_GATEWAY_URL = https://seu-app.railway.app
   NFE_GATEWAY_TOKEN = seu-token-personalizado-seguro
   ```

## 🎯 Teste Completo

```javascript
// Teste no seu ERP
const response = await supabase.functions.invoke('emitir-nfe-v3', {
  body: {
    numeroPedido: 123,
    empresaid: 'sua-empresa',
    loja: 1
  }
});

console.log('NFe via gateway próprio:', response);
```

## 📊 Monitoramento

### Logs em Tempo Real
1. **Railway Dashboard** → **Deployments**
2. **View Logs** → logs em tempo real

### Métricas
1. **Railway Dashboard** → **Metrics**
2. Visualizar CPU, RAM, requests

## 🔄 Auto-Deploy

Cada push no GitHub = deploy automático:

```bash
# Fazer mudanças
git add .
git commit -m "Melhoria no gateway"
git push

# Railway faz deploy automático
```

## 💰 Limites Gratuitos

- **500 horas/mês** (suficiente para desenvolvimento)
- **1GB RAM**
- **1GB storage**
- **Sem limite de requests**

## 🚀 Upgrade para Produção

Se precisar de mais recursos:

1. **Railway Pro:** $5/mês
2. **Recursos ilimitados**
3. **Múltiplos ambientes**
4. **Backup automático**

## 🔧 Alternativas Gratuitas

### Render
```bash
# Similar ao Railway
# 750 horas/mês grátis
# https://render.com
```

### Heroku
```bash
# 550 horas/mês grátis
# Requer cartão (sem cobrança)
# https://heroku.com
```

### Vercel (Para APIs simples)
```bash
# Função serverless
# Limitações para APIs complexas
# https://vercel.com
```

## ✅ Checklist Final

- [ ] Repositório no GitHub
- [ ] Deploy no Railway
- [ ] Variáveis configuradas
- [ ] URL obtida
- [ ] Teste health check
- [ ] Configuração no Supabase
- [ ] Teste emissão NFe
- [ ] Logs funcionando

## 🎉 Pronto!

Seu gateway NFe está rodando em produção **gratuitamente**!

**URL do seu gateway:** `https://seu-app.railway.app`
**Custo:** R$ 0,00
**Comunicação:** Real com SEFAZ
**Funcionamento:** 24/7 