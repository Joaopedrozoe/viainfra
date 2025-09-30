# Como Integrar o Widget de Chat Completo Viainfra

## 🎯 Funcionalidades do Widget

O widget oferece um **chat completo** com:

- ✅ **Menu Principal** interativo
- ✅ **Abertura de Chamados** via Google Apps Script
- ✅ **Chat com Atendente Humano** em tempo real
- ✅ **Consulta de Chamados**
- ✅ **FAQ / Perguntas Frequentes**
- ✅ Notificações de novas mensagens
- ✅ Indicador de digitação
- ✅ Respostas rápidas (quick replies)

## Passo 1: Obter o Company ID

1. Faça login no painel administrativo da Viainfra
2. Vá em **Settings** (Configurações)
3. Copie o **Company ID** da sua empresa

## Passo 2: Configurar o Widget

Abra o arquivo `public/widget-embed.html` e substitua `YOUR_COMPANY_ID_HERE` pelo seu Company ID real:

```javascript
const COMPANY_ID = 'seu-company-id-aqui'; // Linha 232
```

## Passo 3: Hospedar o Widget

### Opção A: Usar CDN (Recomendado)

Faça upload do arquivo `widget-embed.html` para qualquer CDN ou hosting:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

### Opção B: Usar o domínio do próprio sistema

Se você deployar o sistema Viainfra completo, o widget estará disponível em:
```
https://seu-dominio.com/widget-embed.html
```

## Passo 4: Inserir no Site

Adicione o seguinte código **no final do `<body>`** do seu site:

```html
<iframe 
  src="https://seu-dominio.com/widget-embed.html" 
  style="border: none; position: fixed; bottom: 0; right: 0; width: 100%; height: 100%; z-index: 9997; pointer-events: none;"
  allow="clipboard-write"
></iframe>

<style>
  #viainfra-chat-button,
  #viainfra-chat-widget {
    pointer-events: all;
  }
</style>
```

## 🎨 Personalização de Cores

Você pode personalizar as cores editando o arquivo `widget-embed.html`:

```css
/* Cor do gradiente do botão e header */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Substitua por suas cores: */
background: linear-gradient(135deg, #SUA_COR_1 0%, #SUA_COR_2 100%);
```

### Cores principais para alterar:
- `.chat-header` (linha ~86) - Header do chat
- `#viainfra-chat-button` (linha ~15) - Botão flutuante
- `.message.user .message-content` (linha ~146) - Mensagens do usuário
- `.bot-avatar` (linha ~155) - Avatar do bot

## 🔔 Como Funciona o Fluxo

### 1. Usuário clica no balão → Menu Principal

```
👋 Olá! Bem-vindo à Viainfra!
Como posso ajudar você hoje?

1️⃣ Abrir Chamado
2️⃣ Falar com Atendente
3️⃣ Consultar Chamado
4️⃣ FAQ / Dúvidas
```

### 2. Opção "Abrir Chamado"

Inicia o fluxo completo de abertura:
- Seleciona/digita placa
- Informa se é corretiva
- Define local (Canteiro/Oficina)
- Agenda data/hora
- Descreve o problema
- ✅ Chamado criado no Google Sheets + Supabase

### 3. Opção "Falar com Atendente"

- Transfere para atendente humano
- Conversa aparece no painel da Viainfra
- Atendente pode responder em tempo real
- Cliente recebe notificação de novas mensagens

### 4. Polling de Mensagens

O widget verifica a cada **3 segundos** se há novas mensagens do atendente.

## 📱 Como Atendentes Respondem

1. Atendente acessa o painel Viainfra
2. Vai em **Conversas** ou **Inbox**
3. Vê a conversa do canal **Web**
4. Responde diretamente pela plataforma
5. Cliente recebe a mensagem no widget automaticamente

## 🔒 Segurança e LGPD

O widget está configurado para:
- ✅ Armazenar dados **apenas no Supabase** (criptografado)
- ✅ Não usar cookies de terceiros
- ✅ Comunicação via **HTTPS obrigatório**
- ✅ Dados isolados por empresa (**Company ID**)
- ✅ RLS (Row Level Security) habilitado
- ✅ Conformidade com **LGPD Art. 6º** (finalidade específica)

### O que é coletado:

- Nome (opcional)
- Telefone (opcional)
- Email (opcional)
- Histórico de mensagens do chat
- Metadados da conversa (canal, status, timestamps)

### Direitos do Usuário (LGPD):

Certifique-se de incluir em sua **Política de Privacidade**:

1. **Finalidade**: Suporte ao cliente e gestão de chamados
2. **Base Legal**: Execução de contrato (Art. 7º, V)
3. **Direito de Acesso**: Cliente pode solicitar cópia dos dados
4. **Direito de Exclusão**: Cliente pode solicitar exclusão (Art. 18)
5. **Portabilidade**: Dados podem ser exportados
6. **Retenção**: Definir prazo de retenção dos dados

### Exemplo de texto para Política:

```
Ao usar nosso chat de suporte, coletamos seu nome, email e histórico 
de mensagens para fins de atendimento e gestão de chamados. Seus dados 
são armazenados de forma segura e você pode solicitar acesso, correção 
ou exclusão a qualquer momento através do email: privacidade@viainfra.com
```

## 🧪 Testando Localmente

Para testar antes de colocar no site:

1. Abra `widget-embed.html` diretamente no navegador
2. Configure o `COMPANY_ID` correto
3. Teste todas as opções do menu
4. Verifique se as conversas aparecem no painel

## 🐛 Troubleshooting

### Widget não abre
- Verifique se o `COMPANY_ID` está correto
- Abra o Console (F12) e veja se há erros

### Chamados não são criados
- Verifique se a URL do Google Apps Script está correta
- Teste o endpoint diretamente no navegador

### Atendente não recebe mensagens
- Verifique se o `company_id` no banco está correto
- Confirme que a edge function `chat-bot` está ativa

### Widget não carrega no site
- Verifique se a URL do iframe está correta
- Certifique-se que o arquivo está acessível via HTTPS

## 📞 Suporte Técnico

Para dúvidas sobre implementação:
- Email: suporte@viainfra.com
- Documentação: [Link do painel]

## 🔄 Como Atualizar o Widget

**IMPORTANTE**: Você **NÃO** precisa atualizar o código embedado quando:
- Mudar configurações internas do sistema
- Adicionar/remover usuários ou departamentos  
- Modificar canais de atendimento
- Ajustar workflows e bots

**Você SÓ precisa atualizar quando:**
- Houver nova versão do widget com recursos visuais
- Mudar o Company ID
- Atualizar chaves de segurança

📚 **Veja o guia completo**: `WIDGET_UPDATE_GUIDE.md`

---

**Última atualização**: 2025-01-30
**Versão do Widget**: 2.0 (Chat Completo)
