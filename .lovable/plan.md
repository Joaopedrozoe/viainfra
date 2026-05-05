## Plano de correções

Quatro frentes, todas independentes. Vou tratar cada problema com diagnóstico + correção.

---

### 1. Travamentos / lentidão da plataforma

**Causa provável (logs `realtime-sync`):** a cada sync, a função processa 438 chats e gera centenas de logs/iterações sincronamente, inclusive para JIDs inválidos (IDs internos `cmo...`, `@lid` sem mapeamento). Isso pesa no edge runtime e na UI quando o `refreshKey` dispara recargas em cascata em `Inbox`/`ConversationList`.

**Correções:**
- `realtime-sync`: filtrar JIDs inválidos (regex `^cm[a-z0-9]{20,}` e `@lid` sem mapeamento) **antes** do loop de processamento, não dentro de cada iteração. Reduz ~40% das operações.
- `Inbox.tsx`: o `handleRefresh` dispara 3 edge functions em série + `refetch` + `setRefreshKey`. Vou:
  - Remover `setRefreshKey` (já existe realtime via `useConversations`).
  - Tornar `auto-sync-avatars` e `sync-profile-pictures` em background (fire-and-forget) para não bloquear o toast.
- `ConversationList`: garantir que `refreshTrigger` não force re-fetch completo quando o realtime já está ativo (memoizar dependências).

---

### 2. Falhas intermitentes em envio + editar/apagar não refletem na instância

**Diagnóstico:**
- Editar/apagar usam `metadata.external_id || whatsappMessageId || messageId` corretamente, e chamam `chat/updateMessage` e `chat/deleteMessageForEveryone`. O fluxo está certo, mas:
  - **Mensagens recebidas pelo webhook** nem sempre estão guardando `external_id` no metadata — só `messageId`. Quando um agente responde via app, a mensagem do agente só recebe `whatsappMessageId` na metadata se o `send-whatsapp-message` retornar e atualizar. Se a edge não atualizar a metadata da mensagem após enviar, o id fica ausente → editar/apagar falha silenciosamente.
- **Envios intermitentes:** falta retry no `send-whatsapp-message` quando Evolution retorna 5xx ou timeout. Hoje só vai para `message_queue` em alguns casos.

**Correções:**
- `send-whatsapp-message` (envio normal): após sucesso na Evolution API, atualizar `messages.metadata` da mensagem local (`message_id`) com `{ external_id, whatsappMessageId, remoteJid, sentAt }`. Garante que edição/exclusão posteriores tenham os IDs.
- `send-whatsapp-message`: adicionar retry com backoff (3 tentativas: 0s, 1s, 3s) para 5xx/timeout antes de marcar como falha.
- `evolution-webhook` e `evolution-webhook-vialogistic`: ao gravar mensagens recebidas, salvar `external_id` (ID do WhatsApp) explicitamente em `metadata.external_id` além do `messageId` — padroniza chaves para edit/delete.
- `handleConfirmDelete` e `handleSaveEdit` no `ChatWindow`: se faltar `whatsappMessageId`, antes de mostrar erro, fazer fallback buscando na Evolution API via novo endpoint `chat/findMessages` para resolver o ID a partir do timestamp/conteúdo.

---

### 3. Encaminhamento não funciona

**Diagnóstico no `ForwardMessageModal.tsx`:**
- Carrega 50 conversas sem filtro de `company_id` — em multi-empresa pode listar conversas de outra company.
- Ao encaminhar para WhatsApp, chama `send-whatsapp-message` com `message_content: forwardContent || undefined` mas o `forwardContent` para anexo é `undefined`, e a edge function exige `message_content || attachment`. Se `attachment` não tiver `url`/`type` válidos no formato esperado pela edge, vai retornar 400.
- O `attachment` salvo em `messages` muitas vezes está em `metadata.attachment`, não no campo direto da mensagem — então `message.attachment` em runtime pode estar vazio mesmo quando a mensagem original tem mídia.

**Correções:**
- `ForwardMessageModal`:
  - Filtrar conversas pela `company_id` da conversa de origem (passar via prop ou pegar do `useAuth().company.id`).
  - Antes de invocar a edge function, **resolver o anexo** lendo `message.attachment` ou `message.metadata.attachment`, validando `url` e `type` e fazendo um `console.log` claro do payload.
  - Se for anexo de mídia (imagem/vídeo/áudio/documento), enviar somente `attachment` (sem prefixo "↪️ Encaminhada" no `message_content`, pois vira caption duplicada).
  - Aumentar limite de conversas para 100 e adicionar paginação/scroll infinito básico.
- `send-whatsapp-message`: aceitar `attachment.url` em URLs públicas do Supabase Storage e validar com `HEAD` antes de enviar — retornar erro claro se a URL estiver inacessível.

---

### 4. Nomes numéricos no inbox VIALOGISTIC (81 de 149 contatos)

**Diagnóstico:** A função `realtime-sync` salva como nome o que vier de `chat.name || chat.pushName || chat.notify || phone`. Quando a Evolution não tem nome ainda (chat novo, contato sem `pushName` cacheado), cai no `phone`. A função `fix-contact-names` existe mas só usa `findContacts` — nem sempre traz `pushName` para todos os números.

**Correções:**
- Criar nova edge function `enrich-contact-names` que para cada contato VIALOGISTIC com nome numérico:
  1. Tenta `POST /chat/findContacts/VIALOGISTICOFICIAL` com `{ where: { id: "<phone>@s.whatsapp.net" } }` — busca individualizada.
  2. Se vazio, tenta `GET /chat/whatsappProfile/VIALOGISTICOFICIAL/<phone>` (endpoint público de perfil WhatsApp — retorna `name`/`status`).
  3. Se vazio, tenta extrair de `messages.metadata.pushName` das últimas mensagens recebidas desse contato (o webhook costuma trazer `pushName` no payload — mas pode não estar sendo persistido).
  4. Se mesmo assim vazio, mantém o telefone formatado (ex: `+55 11 96275-9168`) ao invés de só dígitos crus.
- `evolution-webhook-vialogistic`: garantir que ao receber mensagem com `pushName` no payload, **sempre atualizar** `contacts.name` se o nome atual for puramente numérico (mesmo se o contato já existir).
- Rodar `enrich-contact-names` uma vez (modo batch) e agendá-la via cron (a cada 6h) para novos contatos.
- Atualizar `realtime-sync` para nunca gravar telefone como `name` — se não houver nome, deixar `name` igual ao telefone formatado e marcar `metadata.needsNameEnrichment = true` para o batch processar depois.

---

### Detalhes técnicos

**Arquivos a editar:**
- `supabase/functions/realtime-sync/index.ts` — filtro de JIDs inválidos antes do loop; não usar phone como name.
- `supabase/functions/send-whatsapp-message/index.ts` — retry, atualização de metadata pós-envio, validação de attachment URL.
- `supabase/functions/evolution-webhook/index.ts` e `evolution-webhook-vialogistic/index.ts` — padronizar `external_id` e atualizar nome quando atual for numérico.
- `supabase/functions/enrich-contact-names/index.ts` — **novo**.
- `src/pages/app/Inbox.tsx` — simplificar `handleRefresh`, remover `refreshKey` redundante.
- `src/components/app/chat/ForwardMessageModal.tsx` — filtrar por company, resolver attachment de `metadata`, evitar caption duplicada.
- `src/components/app/ChatWindow.tsx` — fallback de busca de `whatsappMessageId` quando ausente.

**Sem migração SQL** — todas as mudanças são em código/edge functions.

**Após deploy**, vou:
1. Invocar `enrich-contact-names` em batch para a VIALOGISTIC.
2. Verificar logs de `send-whatsapp-message` para confirmar atualização de metadata.
3. Validar com você fazendo um teste de editar/apagar mensagem recente e encaminhamento.
