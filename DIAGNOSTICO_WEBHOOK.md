# 🔴 DIAGNÓSTICO: Webhook WhatsApp Não Funciona

## Status Atual (31/10/2025 16:15)

### ✅ O que está CORRETO:
1. ✅ Instância VIAINFRA2 está conectada (`status: open`)
2. ✅ Webhook configurado na Evolution API: `https://xxojpfhnkxpbznbmhmua.supabase.co/functions/v1/evolution-webhook`
3. ✅ Edge function `evolution-webhook` deployado e funcionando
4. ✅ Banco de dados configurado corretamente

### ❌ O PROBLEMA REAL:
**Nenhum webhook está chegando ao Supabase** - Zero logs no edge function.

## 🔍 Causas Possíveis:

### 1. Firewall/Bloqueio de Rede
- Evolution API não consegue alcançar o Supabase
- Porta bloqueada ou timeout de conexão

### 2. Webhook Desabilitado na Evolution API
- Apesar de configurado, pode estar desabilitado
- Eventos específicos podem não estar marcados

### 3. Instância em Estado Inconsistente
- WhatsApp conectado MAS webhook não registrado internamente
- Necessário restart da instância

### 4. URL Incorreta ou Inacessível
- Supabase bloqueando requisições da Evolution API
- CORS ou autenticação falhando

## ✅ SOLUÇÃO DEFINITIVA:

### Passo 1: Testar Conectividade
Execute este comando na máquina onde a Evolution API está rodando:

```bash
curl -X POST https://xxojpfhnkxpbznbmhmua.supabase.co/functions/v1/evolution-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "TEST",
    "instance": "VIAINFRA2",
    "data": {"test": true}
  }'
```

**Resultado esperado:** Log aparece no edge function

### Passo 2: Verificar Evolution Manager
Acesse: http://SEU_IP:8080

1. Vá em **Instances** → **VIAINFRA2**
2. Clique em **Webhook Settings**
3. Verifique:
   - ✅ Enabled: **true**
   - ✅ URL: `https://xxojpfhnkxpbznbmhmua.supabase.co/functions/v1/evolution-webhook`
   - ✅ Events: Todos marcados
   - ✅ Webhook By Events: **false**

### Passo 3: Restart da Instância
Na Evolution Manager:
1. Clique em **Logout** na instância VIAINFRA2
2. Aguarde desconectar
3. Clique em **Connect** novamente
4. Escaneie o QR Code se necessário

### Passo 4: Teste Imediato
Envie uma mensagem de teste do WhatsApp para o número **+55 11 94002-7215**

## 📊 Como Verificar se Funcionou:

1. **Imediatamente após enviar**: Deve aparecer log no edge function
2. **Em até 5 segundos**: Mensagem deve aparecer na plataforma Lovable
3. **Bot deve responder**: Automaticamente com o menu inicial

## 🆘 SE AINDA NÃO FUNCIONAR:

O problema está na **configuração do servidor Evolution API**, não no código. Possíveis ações:

1. Verificar logs do container Docker da Evolution API
2. Verificar configuração de rede/firewall
3. Testar com outro provedor de webhook (webhook.site) para confirmar

## 📝 Próximo Teste

Depois de seguir os passos acima, envie uma mensagem de teste e compartilhe:
1. Se apareceu log no evolution-webhook
2. Se a mensagem apareceu na plataforma
3. Qualquer erro que aparecer
