

## Correção: Função de Responder/Mencionar mostrando aviso indevido

### Problema identificado

Na linha 822 de `ChatWindow.tsx`, o código verifica se a mensagem tem `whatsappMessageId`. Se não tiver, exibe o toast:

> "Esta mensagem é antiga e pode não mostrar como resposta no WhatsApp oficial"

**Porém isso está errado.** A ausência de `whatsappMessageId` não significa que a mensagem é "antiga" -- significa apenas que o campo `metadata.whatsappMessageId` ou `metadata.external_id` não foi gravado no banco. Isso pode acontecer com mensagens importadas em lote, mensagens de sync antigo, ou até mensagens recentes com falha de metadata. O WhatsApp oficial NÃO tem essa limitação de tempo para replies.

### O que será feito

**Arquivo:** `src/components/app/ChatWindow.tsx`

1. **Remover o aviso enganoso** (linhas 822-831): O toast "mensagem antiga" será removido. O reply visual no inbox deve funcionar sempre sem assustar o atendente.

2. **Manter o log de console** (apenas para debug): Manter o `console.warn` para diagnóstico técnico, mas sem exibir nada ao usuário.

3. **Enviar reply mesmo sem whatsappMessageId**: Se não houver `whatsappMessageId`, o reply será enviado como mensagem normal (sem citação no WhatsApp), o que já funciona -- o código na linha 442 já faz `quoted: (currentReplyTo && quotedMessageId) ? {...} : undefined`. Nenhuma mudança necessária aqui.

### Sobre o problema da barra de rolagem

Não é possível reproduzir o arquivo de vídeo MP4 no ambiente atual. Preciso que você descreva o comportamento: a barra de rolagem trava? Pula para o topo? Fica tremendo? Com essa informação posso investigar e corrigir.

### Resumo técnico

- **Arquivo modificado:** `src/components/app/ChatWindow.tsx`
- **Mudança:** Remover o `toast.warning` da função `handleReplyMessage` (linhas 828-831), mantendo apenas o log de debug
- **Impacto:** Atendentes poderão responder/mencionar qualquer mensagem sem aviso desnecessário
