# 📱 Como Atualizar o Widget no Seu Site

## Quando preciso atualizar o widget?

**IMPORTANTE**: O widget funciona como um iframe que aponta para nossos servidores. Isso significa que **todas as atualizações no sistema são automáticas** - você NÃO precisa fazer nada!

Você precisa atualizar o código do widget embedado no seu site **apenas** quando:

1. ✅ **Mudança de Company ID**
2. ✅ **Mudança na URL do sistema** (se você usa URL personalizada)
3. ✅ **Personalização visual do botão/balão** (se você editou o CSS diretamente)

## Você NÃO precisa atualizar quando:

- ❌ Alterar configurações internas do sistema (usuários, departamentos, etc)
- ❌ Modificar canais de atendimento
- ❌ Ajustar workflows e bots
- ❌ Atualizar informações da empresa
- ❌ Adicionar novos recursos ao sistema
- ❌ Corrigir bugs ou melhorias
- ❌ Atualizar respostas automáticas ou scripts

**Por quê?** O widget é um iframe que carrega conteúdo direto dos nossos servidores. Toda vez que um cliente abre o widget, ele recebe a versão mais recente automaticamente!

## Como atualizar o widget?

### Opção 1: Widget Hospedado pela Viainfra (Recomendado)

Se você usa o widget hospedado em nossos servidores, **não precisa fazer nada!** Todas as atualizações são automáticas.

Código no seu site:
```html
<script src="https://widget.viainfra.com.br/widget.js" company-id="SEU_COMPANY_ID"></script>
```

✅ **Vantagem**: Atualizações automáticas
✅ **Vantagem**: Sem necessidade de manutenção

### Opção 2: Widget Self-Hosted (Auto-hospedado)

Se você copiou o arquivo `widget-script.js` para o seu servidor, precisa seguir estes passos:

#### 1. Baixar a versão mais recente
```bash
# Acesse o painel administrativo
# Vá em: Canais > Widget > Baixar Widget
```

#### 2. Atualizar o arquivo no seu servidor
- Substitua o arquivo `widget-script.js` antigo pelo novo
- Mantenha o mesmo nome do arquivo
- Limpe o cache do CDN (se usar)

#### 3. Verificar se está funcionando
- Abra seu site em modo anônimo
- Clique no botão do widget
- Teste todas as funcionalidades

## Versões do Widget

### Versão Atual: 2.0.1 (Janeiro 2025)

**Funcionalidades:**
- ✅ Chat em tempo real
- ✅ Abertura de chamados
- ✅ Consulta de status
- ✅ FAQ integrado
- ✅ Notificações de mensagens
- ✅ Respostas rápidas

**Arquivos incluídos:**
- `widget-script.js` - Script principal
- `widget-embed.html` - HTML do widget (iframe)

### Changelog

#### v2.0.1 (30/01/2025)
- 🐛 Correção de bug no envio de arquivos
- ⚡ Melhorias de performance no carregamento
- 🎨 Ajustes visuais no modo mobile

#### v2.0.0 (15/01/2025)
- ✨ Nova funcionalidade de chat em tempo real
- ✨ Sistema de notificações
- 🎨 Redesign completo da interface

## Estrutura de Arquivos

```
seu-site/
├── index.html (sua página)
└── assets/
    └── widget/
        ├── widget-script.js     ← Atualizar este arquivo
        └── widget-embed.html    ← Atualizar este arquivo
```

## Como Saber se Preciso Atualizar?

### Método 1: Verificar Versão Automaticamente

Abra o console do navegador (F12) e digite:
```javascript
console.log(window.ViainfraWidget.version);
```

Se aparecer uma versão **inferior a 2.0.1**, você deve atualizar.

### Método 2: Receber Notificações

Configure notificações automáticas:
1. Acesse: **Configurações > Notificações**
2. Ative: **"Avisar sobre atualizações do widget"**
3. Você receberá um email quando houver atualizações

## Problemas Comuns ao Atualizar

### 1. Widget não aparece depois da atualização

**Solução:**
```javascript
// Limpe o cache do navegador
// Ctrl + Shift + Delete (Windows)
// Cmd + Shift + Delete (Mac)

// Ou force reload com:
Ctrl + F5 (Windows)
Cmd + Shift + R (Mac)
```

### 2. Erro "Company ID inválido"

**Solução:**
- Verifique se o COMPANY_ID está correto no `widget-script.js`
- Copie o ID correto de: **Configurações > Integrações > Widget**

### 3. Widget carrega mas não envia mensagens

**Solução:**
- Verifique se a URL do Supabase está correta
- Confira se a chave de API (SUPABASE_KEY) está atualizada
- Teste em: **Canais > Widget > Testar Conexão**

## Configuração Avançada

### Personalizar cores do widget

Edite o arquivo `widget-script.js`:

```javascript
// Linha ~23
background: linear-gradient(135deg, #SUA_COR_1 0%, #SUA_COR_2 100%);
```

### Alterar posição do botão

```javascript
// Linha ~17
bottom: 20px;  // Distância do fundo
right: 20px;   // Distância da direita
```

### Desabilitar notificações sonoras

```javascript
// Linha ~256
const ENABLE_SOUND = false; // Altere para false
```

## FAQ

### **P: Com que frequência preciso atualizar?**
**R:** Recomendamos verificar atualizações mensalmente. Atualizações críticas de segurança serão notificadas por email.

### **P: A atualização quebra o widget no site?**
**R:** Não, mantemos compatibilidade retroativa. Mas teste sempre em ambiente de homologação primeiro.

### **P: Posso reverter para uma versão antiga?**
**R:** Sim, entre em contato com suporte@viainfra.com para obter versões anteriores.

### **P: O widget funciona offline?**
**R:** Não, é necessário conexão com internet para carregar e usar o widget.

## Suporte

Se tiver dúvidas sobre atualizações:

- 📧 Email: suporte@viainfra.com
- 💬 Chat: https://viainfra.com.br/suporte
- 📱 WhatsApp: (11) 99999-9999

---

**Última atualização**: 30/01/2025
**Versão deste guia**: 1.0
