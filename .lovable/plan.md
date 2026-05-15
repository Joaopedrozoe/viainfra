## Plano de correções (3 frentes)

### 1. Trocar "Sandra Romano" por "Eliane Furtado" na mensagem de opções do chat web

**Arquivos:**
- `supabase/functions/chat-bot/index.ts` (linha 274) — bot do chat web (Vialogistic). Trocar `"👥 RH": "Sandra Romano"` por `"👥 RH": "Eliane Furtado"`.
- `supabase/functions/evolution-webhook/bot-flow-processor.ts` (linha 271) e `supabase/functions/evolution-webhook-vialogistic/bot-flow-processor.ts` (linha 271) — `5: { nome: 'RH', atendente: 'Sandra Romano' }` → `'Eliane Furtado'`. Garante consistência também no fluxo WhatsApp.
- `public/setup-users.html` (linhas 278-279) — atualizar card visual para `Eliane Furtado` / `eliane.furtado@vialogistic.com.br`.

Sem migração de banco — o usuário Eliane já foi criado/migrado anteriormente.

---

### 2. Garantir envio/recebimento bidirecional no canal Web

**Diagnóstico atual:**
- Agente → Web: `ChatWindow` insere mensagem com `sender_type='agent'` direto na tabela `messages`. O widget público lê via `get_web_conversation_messages` (RPC) que retorna `sender_type` corretamente — então a mensagem **chega**, mas o widget só **renderiza** `'user'` e `'bot'`, ignorando `'agent'` em alguns casos. Precisa revisar `public/widget-script.js` e `public/widget-embed.html` para garantir que mensagens com `sender_type='agent'` sejam exibidas como mensagem do atendente (bolha "à esquerda" com nome).
- Web → Agente: `send_web_conversation_message` insere com `sender_type='user'`. Inserção dispara realtime na tabela `messages` que o `useConversations` escuta. Funciona se realtime estiver conectado (ver item 3).
- Após o atendente assumir, o `chat-bot` precisa parar de responder para essa conversa. Verificar flag `bot_active=false` ou `metadata.agent_takeover` (já existe nos logs `agent_takeover: true`) e fazer o `chat-bot/index.ts` retornar early quando essa flag estiver setada.

**Mudanças:**
- `public/widget-script.js` e `public/widget-embed.html`: tratar `sender_type='agent'` igual a `'bot'` para renderização (bolha esquerda), com label do atendente (ex.: "Atendente").
- `supabase/functions/chat-bot/index.ts`: no início, ler `conversations.metadata.agent_takeover` ou `bot_active=false` da conversa atual e, se true, retornar sem gerar resposta automática.
- Verificar realtime no widget: hoje o widget faz polling a cada N segundos. Adicionar canal Supabase realtime na tabela `messages` filtrado por `conversation_id` para receber mensagens do agente instantaneamente. Usa o `access_token` já existente para validar.

---

### 3. Performance / delay no app

**Causa raiz (visível nos logs do console):**
```
🔄 Fast poll (realtime disconnected)
```
O realtime do Supabase está desconectado e o app cai em fast poll a cada 15s, refazendo `fetchConversations` que retorna 200 conversas + joins. Isso trava a UI, especialmente no Inbox.

**Correções em `src/hooks/useConversations.ts`:**
- O `useEffect` que monta o canal realtime tem `[company?.id, fetchConversations, handleNewMessage]` como deps. `fetchConversations` e `handleNewMessage` são recriados a cada render porque dependem de `conversations` no `useCallback` interno → o canal é desinscrito/reinscrito constantemente, e o Supabase Realtime acaba ficando em `CHANNEL_ERROR`/`CLOSED`. Solução:
  - Estabilizar handlers via `useRef` (já existe `handleNewMessageRef`, fazer o mesmo para `fetchConversations`).
  - Reduzir deps do effect para apenas `[company?.id]`.
- Limitar query inicial a 100 conversas mais recentes (`order('updated_at', desc).limit(100)`) e usar paginação para o resto.
- Aumentar o intervalo de fast-poll de 15s para 30s e o de routine sync de 60s para 120s.
- Adicionar reconexão explícita: quando o canal entrar em `CHANNEL_ERROR`/`CLOSED`, agendar `setTimeout(() => supabase.removeChannel + recreate, 5000)` em vez de só logar.

**Correções em `src/pages/app/Inbox.tsx`:**
- Remover `refreshKey` e os `setRefreshKey` (linha 33 e usos) — força re-mount de `ConversationList` desnecessariamente, ampliando o lag.
- O `useEffect` de auto-sync de avatares (linhas 48-70) já está OK (1h), manter.

**Correções em `ConversationList`:**
- Memoizar a lista filtrada com `useMemo` baseado em `[conversations, searchQuery, statusFilter]` para evitar re-renderização das 200 linhas a cada keystroke.
- Virtualizar a lista se passar de 80 itens (usar `react-window` que já está instalado, ou implementar render-on-scroll simples).

---

### Detalhes técnicos

**Arquivos a editar:**
- `supabase/functions/chat-bot/index.ts` — trocar Sandra→Eliane + adicionar guarda de `agent_takeover`/`bot_active`.
- `supabase/functions/evolution-webhook/bot-flow-processor.ts` — Sandra→Eliane.
- `supabase/functions/evolution-webhook-vialogistic/bot-flow-processor.ts` — Sandra→Eliane.
- `public/setup-users.html` — atualizar card.
- `public/widget-script.js` — renderizar `sender_type='agent'`; adicionar realtime via Supabase channel.
- `public/widget-embed.html` — idem se houver lógica de render local.
- `src/hooks/useConversations.ts` — estabilizar realtime via refs, reduzir deps, limitar query a 100, reconexão automática.
- `src/pages/app/Inbox.tsx` — remover `refreshKey`.
- `src/components/app/ConversationList.tsx` — memoizar filtros.

**Sem migração SQL.** Edge functions são deployadas automaticamente.

**Validação após deploy:**
1. Confirmar nos logs do console que aparece `✅ Realtime CONNECTED` e que o `Fast poll` desaparece.
2. Testar fluxo web: abrir widget → mandar mensagem → ver no inbox; responder do inbox → ver no widget em tempo real.
3. Selecionar opção "RH" no chat e confirmar que o nome exibido é Eliane Furtado.
