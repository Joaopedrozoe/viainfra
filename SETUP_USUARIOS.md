# 🚀 Setup Inicial - Criar Usuários Viainfra

## ⚠️ IMPORTANTE: Execute APENAS UMA VEZ!

Este processo criará:
- ✅ Empresa **Viainfra** (plano Enterprise)
- ✅ 5 usuários atendentes com acesso ao sistema

---

## 📋 Usuários que serão criados:

### 👑 Admin Master
- **Nome**: Elisabete Silva
- **Email**: elisabete.silva@viainfra.com.br
- **Senha**: atendimento@25
- **Permissões**: Administrador completo

### 👥 Atendentes
1. **Joicy Souza** - atendimento@viainfra.com.br
2. **Suelem Souza** - manutencao@viainfra.com.br
3. **Giovanna Ferreira** - gestaofinanceira@vianfra.com.br
4. **Sandra Romano** - sandra.romano@vialogistic.com.br

**Senha de todos**: `atendimento@25`

---

## 🔧 Como Executar o Setup

### Opção 1: Via Interface Web (Recomendado)

1. Abra no navegador:
   ```
   https://seu-dominio.com/setup-users.html
   ```

2. Clique no botão **"🚀 Executar Setup"**

3. Aguarde a confirmação de sucesso

4. **Anote o COMPANY_ID** que aparecerá no resultado!

### Opção 2: Via cURL (Terminal)

```bash
curl -X POST \
  https://xxojpfhnkxpbznbmhmua.supabase.co/functions/v1/setup-users \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4b2pwZmhua3hwYnpuYm1obXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzY4NTUsImV4cCI6MjA3NDgxMjg1NX0.K7pqFCShUgQWJgrHThPynEguIkS0_TjIOuKXvIEgNR4"
```

---

## ✅ Verificação Pós-Setup

### 1. Verificar usuários criados

Acesse: https://supabase.com/dashboard/project/xxojpfhnkxpbznbmhmua/auth/users

Você deve ver os 5 usuários listados com status "Confirmed".

### 2. Testar login

1. Acesse a página de login: `https://seu-dominio.com/login`
2. Use qualquer um dos emails acima
3. Senha: `atendimento@25`

### 3. Configurar Widget

Após o setup, você receberá o **COMPANY_ID**.

Edite o arquivo `public/widget-embed.html` e substitua:

```javascript
const COMPANY_ID = 'seu-company-id-aqui'; // ← Cole o ID aqui
```

---

## 🔑 COMPANY_ID - Para Configurar no Widget

Após executar o setup, o **COMPANY_ID** será exibido no resultado.

**Exemplo de resultado:**
```
✅ Setup concluído com sucesso!
Empresa: Viainfra (ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
```

**Copie o ID** (ex: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`) e use no widget!

---

## 🐛 Troubleshooting

### Erro: "User already exists"
✅ Normal! Significa que o setup já foi executado antes. Os usuários existentes serão atualizados.

### Erro: "Invalid API Key"
❌ Verifique se você está usando a URL correta do Supabase.

### Usuários não conseguem fazer login
1. Verifique se os emails estão confirmados no painel do Supabase
2. Certifique-se que a senha está correta: `atendimento@25`
3. Verifique se as URLs de redirect estão configuradas corretamente

### Como resetar um usuário?

Execute o setup novamente. A função é idempotente e atualizará usuários existentes.

---

## 📞 Próximos Passos

Após o setup bem-sucedido:

1. ✅ Faça login com Elisabete (admin master)
2. ✅ Configure o COMPANY_ID no widget
3. ✅ Teste o widget no site
4. ✅ Verifique se as conversas aparecem no painel
5. ✅ Teste responder conversas como atendente

---

## 🔒 Segurança

- ✅ Senhas são hasheadas pelo Supabase Auth
- ✅ Emails são automaticamente confirmados
- ✅ RLS (Row Level Security) está habilitado
- ✅ Cada empresa tem dados isolados

**⚠️ IMPORTANTE:** Altere as senhas após o primeiro login!

---

## 📝 Logs

Para visualizar os logs da execução:

https://supabase.com/dashboard/project/xxojpfhnkxpbznbmhmua/functions/setup-users/logs

---

**Última atualização**: 2025-01-30  
**Versão**: 1.0
