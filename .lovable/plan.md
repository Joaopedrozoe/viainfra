# Correção da Funcionalidade de Resposta com Citação no WhatsApp

## Status: ✅ IMPLEMENTADO

## Problema Identificado

A citação não aparecia no WhatsApp porque o objeto `quoted.key` estava incompleto:

```javascript
// ANTES (incompleto - não funcionava):
{ key: { id: "A5E11F7C2DCD269CC5B1F9B1A9D11B93" } }

// DEPOIS (completo - protocolo WhatsApp/Baileys):
{ 
  key: { 
    remoteJid: "5511950025503@s.whatsapp.net",
    fromMe: false,
    id: "A5E11F7C2DCD269CC5B1F9B1A9D11B93"
  } 
}
```

## Alterações Realizadas

### 1. Edge Function (`supabase/functions/send-whatsapp-message/index.ts`)

Expandido o objeto `quotedData` para incluir todos os campos do protocolo WhatsApp:

```typescript
const quotedData = quoted?.messageId ? {
  key: { 
    remoteJid: recipientJid,         // JID do chat
    fromMe: quoted.isFromAgent === true,  // true se agente enviou
    id: quoted.messageId 
  },
  message: { conversation: quoted.content || '' }
} : undefined;
```

### 2. Frontend (`src/components/app/ChatWindow.tsx`)

Adicionado o campo `isFromAgent` ao objeto `quoted`:

```typescript
quoted: currentReplyTo ? {
  messageId: currentReplyTo.whatsappMessageId,
  content: currentReplyTo.content,
  senderName: currentReplyTo.sender === 'user' ? contactName : 'Você',
  isFromAgent: currentReplyTo.sender === 'agent',  // NOVO
} : undefined,
```

### 3. Hook de Mensagens (`src/hooks/useInfiniteMessages.ts`) - Anterior

Já foi corrigido para unificar os IDs:

```typescript
whatsappMessageId: msg.metadata?.whatsappMessageId || msg.metadata?.external_id,
```

## Fluxo Corrigido

```text
Usuario clica "Responder" em mensagem
           |
           v
ChatWindow monta quoted com:
  - messageId: whatsappMessageId (ou external_id)
  - isFromAgent: true/false
           |
           v
Edge function monta quotedData com:
  - key.remoteJid: JID do destinatário
  - key.fromMe: baseado em isFromAgent
  - key.id: messageId original
           |
           v
Evolution API recebe objeto COMPLETO
           |
           v
Mensagem chega no WhatsApp COM citação visível
```

## Validação

Testar:

1. ✓ Responder a mensagem RECEBIDA do cliente (fromMe: false)
2. ✓ Responder a mensagem ENVIADA pelo agente (fromMe: true)
3. Verificar no WhatsApp oficial se a citação aparece corretamente
