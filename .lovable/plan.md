

# Plano: Correção da Funcionalidade de Resposta com Citação no WhatsApp

## Resumo do Problema

A funcionalidade de responder mensagens no Inbox está funcionando visualmente, porém a citação **não é refletida no WhatsApp oficial**. A mensagem chega como mensagem comum, sem vínculo à mensagem original.

## Diagnóstico Técnico

### Causa Raiz Identificada

O sistema armazena dois IDs diferentes para mensagens do WhatsApp:

| Campo | Usado Para | Onde é Definido |
|-------|------------|-----------------|
| `external_id` | Mensagens RECEBIDAS do WhatsApp | `evolution-webhook` ao salvar mensagem |
| `whatsappMessageId` | Mensagens ENVIADAS pelo agente | `send-whatsapp-message` após resposta da API |

**Problema**: O frontend só procura por `whatsappMessageId`, que não existe em mensagens recebidas. Portanto, ao responder uma mensagem do cliente, o ID da mensagem original é `undefined`.

### Fluxo Atual (Com Falha)

```text
Usuario clica "Responder" em mensagem do cliente
           |
           v
ChatWindow pega: currentReplyTo.whatsappMessageId = undefined
           |
           v
Edge function recebe: quoted.messageId = undefined
           |
           v
Verificacao: quoted?.messageId ? false --> quotedData = undefined
           |
           v
Evolution API recebe: SEM parametro quoted
           |
           v
Mensagem chega no WhatsApp SEM citacao
```

### Logs Confirmando o Problema

```
[send-whatsapp] Quoted data: { content: "bom dia - teste resposta..." }
[send-whatsapp] hasQuoted: false  <-- FALSO porque messageId esta undefined
```

## Solucao Proposta

### Fase 1: Unificar ID do WhatsApp no Frontend

Modificar o mapeamento em `useInfiniteMessages.ts` para usar `external_id` como fallback:

```typescript
// Antes:
whatsappMessageId: msg.metadata?.whatsappMessageId,

// Depois:
whatsappMessageId: msg.metadata?.whatsappMessageId || msg.metadata?.external_id,
```

### Fase 2: Garantir Fallback no ChatWindow

Adicionar fallback no `ChatWindow.tsx` ao montar o objeto `quoted`:

```typescript
quoted: currentReplyTo ? {
  messageId: currentReplyTo.whatsappMessageId || currentReplyTo.id,
  content: currentReplyTo.content,
} : undefined,
```

**Nota**: O `currentReplyTo.id` (UUID do banco) nao funcionaria com a Evolution API, mas apos a Fase 1 o `whatsappMessageId` sempre tera o valor correto.

### Fase 3: Adicionar Log de Debug na Edge Function

Melhorar log para diagnostico futuro:

```typescript
console.log('[send-whatsapp] Quoted data received:', JSON.stringify(quoted));
console.log('[send-whatsapp] Will send with quoted:', !!quotedData);
```

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useInfiniteMessages.ts` | Linha 51: adicionar fallback para `external_id` |
| `src/components/app/ChatWindow.tsx` | Linhas 385-388: garantir fallback no objeto `quoted` |
| `supabase/functions/send-whatsapp-message/index.ts` | Melhorar logs de debug |

## Fluxo Corrigido

```text
Usuario clica "Responder" em mensagem do cliente
           |
           v
useInfiniteMessages mapeia: whatsappMessageId = external_id
           |
           v
ChatWindow pega: currentReplyTo.whatsappMessageId = "A53084BFE..."
           |
           v
Edge function recebe: quoted.messageId = "A53084BFE..."
           |
           v
Verificacao: quoted?.messageId ? true --> quotedData criado
           |
           v
Evolution API recebe: { quoted: { key: { id: "A53084BFE..." }, message: {...} } }
           |
           v
Mensagem chega no WhatsApp COM citacao visivel
```

## Validacao

Apos implementacao:

1. Selecionar uma mensagem recebida de um contato
2. Clicar em "Responder"
3. Digitar resposta e enviar
4. Verificar no WhatsApp oficial se a mensagem chegou com a citacao visivel (barra verde com texto original)

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| `external_id` pode ter formato diferente entre versoes da Evolution API | O formato observado (hash alfanumerico) e consistente com a documentacao |
| Mensagens muito antigas podem nao ter `external_id` | Fallback para `undefined` - comportamento atual |
| Cache do frontend pode manter dados antigos | Recarregar a conversa apos implementacao |

