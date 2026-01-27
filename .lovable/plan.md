
# Diagnóstico e Plano: Sincronização de Ações de Mensagem com WhatsApp

## Diagnóstico Atual

### Estado das Funcionalidades

| Funcionalidade | Estado Atual | Sincroniza com WhatsApp? | Suporte da Evolution API |
|---------------|--------------|--------------------------|-------------------------|
| **Copiar texto** | Funcional | N/A (local only) | N/A |
| **Editar mensagem** | Parcialmente implementado | Tenta sincronizar | Sim - `PUT /chat/updateMessage/{instance}` |
| **Fixar mensagem** | Funcional localmente | Nao | Nao suportado pela API |
| **Favoritar mensagem** | Funcional localmente | Nao | Nao suportado pela API |
| **Encaminhar mensagem** | Funcional localmente | Nao | Sim - via `sendText` com conteudo |
| **Apagar mensagem** | Funcional localmente | Nao | Nao encontrado na API |
| **Responder (reply/quote)** | Recebe do WhatsApp | Nao envia | Sim - parametro `quoted` no `sendText` |

---

## Detalhamento por Funcionalidade

### 1. Editar Mensagem
**Estado atual:** Implementado em `ChatWindow.tsx` (linhas 526-603)
- Atualiza localmente no banco de dados
- Tenta chamar Evolution API via `handleUpdateMessage` em `send-whatsapp-message`
- **Problema:** Requer `whatsappMessageId` e `remoteJid` nos metadados, que nem sempre estao disponiveis
- **Limitacao WhatsApp:** Edicao so funciona em mensagens enviadas ha menos de ~15 minutos

**Acao:** Melhorar feedback visual quando edicao no WhatsApp nao for possivel

### 2. Fixar Mensagem
**Estado atual:** Funciona apenas localmente (metadados `isPinned`)
**Suporte WhatsApp:** NAO SUPORTADO
- A API do WhatsApp Business/Evolution nao oferece endpoint para fixar mensagens em conversas
- Fixar mensagens e uma funcionalidade apenas de grupos e apenas para admins

**Acao:** Manter como funcionalidade LOCAL do CRM. Deixar claro na UI que e uma organizacao interna.

### 3. Favoritar Mensagem
**Estado atual:** Funciona apenas localmente (metadados `isFavorite`)
**Suporte WhatsApp:** NAO SUPORTADO
- WhatsApp nao tem conceito de "favoritos" em mensagens de chat
- A funcao "Mensagens Favoritas" do WhatsApp e por selecao manual do usuario

**Acao:** Manter como funcionalidade LOCAL do CRM. Deixar claro na UI que e uma organizacao interna.

### 4. Encaminhar Mensagem
**Estado atual:** `ForwardMessageModal.tsx` - apenas insere no banco local
- Cria nova mensagem com prefixo "Encaminhada:"
- NAO envia para o WhatsApp do destinatario

**Acao:** Integrar com `send-whatsapp-message` para envio real

### 5. Apagar Mensagem
**Estado atual:** Remove do banco local apenas
**Suporte WhatsApp:** LIMITADO
- Evolution API v1 tinha `/chat/deleteMessage` mas comportamento inconsistente
- "Apagar para todos" tem janela de tempo limitada

**Acao:** Manter como local e informar limitacao

### 6. Responder Mensagem (NOVA FUNCIONALIDADE)
**Estado atual:** Recebe e exibe mensagens citadas do WhatsApp
- Campos `quotedMessageId`, `quotedContent`, `quotedSender` ja existem
- NAO implementado o envio de resposta com citacao

**Suporte Evolution API:** SIM
```json
{
  "number": "5511999999999",
  "text": "Resposta aqui",
  "quoted": {
    "key": { "id": "mensagem-original-id" },
    "message": { "conversation": "texto original" }
  }
}
```

---

## Plano de Implementacao

### Fase 1: Clarificar Expectativas na UI

**Alteracoes em `MessageActions.tsx`:**
- Adicionar tooltips explicando comportamento de cada acao
- Fixar/Favoritar: indicar que sao organizacao interna do CRM
- Editar: indicar limitacao de 15 minutos do WhatsApp

### Fase 2: Implementar Encaminhamento Real

**Alteracoes em `ForwardMessageModal.tsx`:**
1. Apos inserir mensagem no banco, verificar se conversa destino e WhatsApp
2. Chamar `send-whatsapp-message` para envio real
3. Atualizar status de entrega na mensagem

**Codigo proposto:**
```typescript
// Apos inserir mensagem no banco
if (targetConversation.channel === 'whatsapp') {
  await supabase.functions.invoke('send-whatsapp-message', {
    body: {
      conversation_id: targetConversationId,
      message_content: forwardContent,
      message_id: newMessageId,
      agent_name: profile.name
    }
  });
}
```

### Fase 3: Implementar Resposta com Citacao (Reply)

**Novas alteracoes:**

1. **Adicionar estado de "replyTo" no ChatWindow:**
```typescript
const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
```

2. **Adicionar acao "Responder" no menu de contexto (`MessageActions.tsx`):**
```typescript
<ContextMenuItem onClick={() => onReply(message)}>
  <Reply className="w-4 h-4 mr-2" />
  Responder
</ContextMenuItem>
```

3. **Modificar `ChatInput.tsx` para exibir preview da mensagem citada:**
- Barra acima do input mostrando mensagem sendo respondida
- Botao X para cancelar resposta

4. **Modificar `handleSendMessage` para incluir dados de citacao:**
```typescript
if (replyToMessage) {
  metadata.quotedMessageId = replyToMessage.whatsappMessageId;
  metadata.quotedContent = replyToMessage.content;
  metadata.quotedSender = replyToMessage.sender === 'user' ? contactName : 'Voce';
}
```

5. **Atualizar `send-whatsapp-message` para enviar com `quoted`:**
```typescript
body: {
  number: recipientJid,
  text: formattedMessage,
  quoted: replyToMessageId ? {
    key: { id: replyToMessageId },
    message: { conversation: replyToContent }
  } : undefined
}
```

---

## Secao Tecnica

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/app/chat/MessageActions.tsx` | Adicionar opcao "Responder" e tooltips |
| `src/components/app/chat/ChatInput.tsx` | Adicionar preview de resposta e props para replyTo |
| `src/components/app/ChatWindow.tsx` | Gerenciar estado de replyTo, passar para ChatInput |
| `src/components/app/chat/ForwardMessageModal.tsx` | Integrar com send-whatsapp-message |
| `src/components/app/chat/types.ts` | Atualizar ChatInputProps para incluir replyTo |
| `supabase/functions/send-whatsapp-message/index.ts` | Suportar parametro `quoted` no envio |

### Fluxo de Resposta com Citacao

```text
+------------------+     +-------------------+     +----------------------+
| Usuario clica    | --> | Preview aparece   | --> | Mensagem enviada com |
| "Responder"      |     | acima do input    |     | quoted para WhatsApp |
+------------------+     +-------------------+     +----------------------+
                                |
                                v
                         +-------------------+
                         | Mensagem salva    |
                         | com metadados de  |
                         | quotedMessageId   |
                         +-------------------+
```

---

## Resumo de Comportamentos Finais

| Funcionalidade | Comportamento Final |
|---------------|---------------------|
| **Copiar** | Local apenas (OK) |
| **Editar** | Tenta WhatsApp, fallback local com aviso |
| **Fixar** | LOCAL apenas - organizacao interna CRM |
| **Favoritar** | LOCAL apenas - organizacao interna CRM |
| **Encaminhar** | Envia mensagem real para WhatsApp |
| **Apagar** | LOCAL apenas - nao afeta WhatsApp |
| **Responder** | NOVO - Envia com citacao para WhatsApp |

### Indicadores Visuais Propostos

- Fixar/Favoritar: Tooltip "Organizacao interna do CRM"
- Editar: Tooltip "Limite de 15 min para refletir no WhatsApp"
- Responder: Nova opcao com icone de seta de reply
