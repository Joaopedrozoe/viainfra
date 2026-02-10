
## Correção: Respostas (Reply) Não Funcionam no WhatsApp

### Problema Identificado

O campo `whatsappMessageId` -- essencial para o protocolo de reply do WhatsApp -- **nao esta sendo preenchido** nas mensagens recebidas via Supabase Realtime. Isso faz com que toda tentativa de responder a uma mensagem resulte em envio sem citacao.

### Causa Raiz

Existem dois caminhos pelos quais mensagens chegam ao chat:

1. **Carregamento inicial** (`useInfiniteMessages.ts`, funcao `mapMessage`): Preenche `whatsappMessageId` corretamente usando `metadata.whatsappMessageId || metadata.external_id`
2. **Tempo real** (`ChatWindow.tsx`, handler do Realtime): **Nao preenche** `whatsappMessageId` -- o campo fica `undefined`

Como a maioria das mensagens durante uma conversa ativa chega pelo canal de tempo real, o campo fica vazio, e ao tentar responder:
- O sistema exibe o aviso "Esta mensagem e antiga e pode nao mostrar como resposta"
- O `quoted` e enviado como `undefined` para a Edge Function
- A mensagem e enviada sem citacao no WhatsApp oficial

### Evidencia nos Logs

Os logs da Edge Function `send-whatsapp-message` confirmam:
```
Quoted data received: undefined
Quoted messageId: MISSING
Will send with quoted: false
```

### Correcao

**Arquivo: `src/components/app/ChatWindow.tsx`**

Adicionar o campo `whatsappMessageId` no mapeamento do handler Realtime (por volta da linha 111), usando a mesma logica do `useInfiniteMessages`:

```
whatsappMessageId: newMessage.metadata?.whatsappMessageId || newMessage.metadata?.external_id,
```

Isso resolve o problema para todas as mensagens que chegam em tempo real (tanto do usuario quanto do agente).

### Impacto

- Nenhuma alteracao no fluxo de envio (Edge Function)
- Nenhuma alteracao na logica de citacao existente
- Nenhuma alteracao na ordenacao ou filtragem do Inbox
- Correcao pontual de 1 linha no handler Realtime
- Mensagens ja carregadas via scroll/paginacao continuam funcionando normalmente (ja tinham a logica correta)

### Validacao

Apos a correcao:
1. Receber uma mensagem nova de um contato
2. Clicar com botao direito e selecionar "Responder"
3. O aviso de "mensagem antiga" **nao** deve aparecer
4. A resposta deve aparecer como citacao no WhatsApp oficial do destinatario
