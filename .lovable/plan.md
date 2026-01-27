

# Plano: Correção da Funcionalidade de Resposta com Citação no WhatsApp

## ✅ IMPLEMENTADO

### Correções Aplicadas

1. **`src/hooks/useInfiniteMessages.ts` (linha 51)**
   - Unificado o mapeamento de ID do WhatsApp
   - Agora usa `whatsappMessageId || external_id` como fallback
   - Mensagens recebidas (que usam `external_id`) agora têm o ID correto para citações

2. **`src/components/app/ChatWindow.tsx` (linhas 384-389)**
   - Adicionado comentário explicativo sobre a unificação de IDs
   - Incluído `senderName` no objeto `quoted` para contexto visual

3. **`supabase/functions/send-whatsapp-message/index.ts` (linhas 53-57)**
   - Melhorado log de debug para diagnóstico futuro
   - Log separado para `quoted.messageId` e flag de envio com citação

## Validação

Para testar:
1. Abrir conversa no Inbox
2. Clicar em "Responder" em uma mensagem RECEBIDA do cliente
3. Digitar resposta e enviar
4. Verificar no WhatsApp oficial se a mensagem chegou COM a citação visível (barra verde)

## Fluxo Corrigido

```text
Usuario clica "Responder" em mensagem do cliente
           |
           v
useInfiniteMessages mapeia: whatsappMessageId = external_id (fallback)
           |
           v
ChatWindow pega: currentReplyTo.whatsappMessageId = "A53084BFE..."
           |
           v
Edge function recebe: quoted.messageId = "A53084BFE..."
           |
           v
Evolution API recebe: { quoted: { key: { id: "A53084BFE..." }, message: {...} } }
           |
           v
Mensagem chega no WhatsApp COM citação visível
```
