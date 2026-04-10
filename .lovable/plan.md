

## Fix: Group Message Sending, Forwarding, and Internal Chat

### Three Issues Identified

**1. Group messages not sending (Serviços Zigurate)**

The edge function logs show NO entries with `g.us` — meaning the group send path is never being reached. The likely cause: the conversation's `metadata.remoteJid` may not contain `@g.us` or `metadata.isGroup` is not set, so the function treats it as an individual chat and fails silently (wrong recipient JID).

Additionally, line 460 uses `chat/sendPresence` endpoint while the working group functions (force-send-group, debug-group-send-v3) use `chat/updatePresence`. This endpoint mismatch may cause the presence step to fail, breaking the group send flow.

**Fix:**
- Add defensive group detection: also check if `recipientJid` ends with `@g.us` regardless of metadata flags
- Standardize presence endpoint to `chat/updatePresence` (proven working in other functions)
- Add explicit logging of the group JID being used so we can trace failures
- Consume response bodies for `fetch` calls that aren't currently consumed (prevents resource leaks in Deno)

**2. Forwarded messages not sending attachments**

The `ForwardMessageModal` correctly extracts `message.attachment` and passes it to `send-whatsapp-message`. However, when `message.content` is empty or just a placeholder like `[Imagem]`, the forwarding sends `forwardContent` as empty string. The edge function then formats it as `*Atendente*\n` (empty text after agent name). For media, this means the caption is just the agent name with no actual content — but the real issue is the `attachment` object may be missing required fields (`mimeType`, proper `url`).

**Fix:**
- Ensure `forwardContent` for attachments defaults to `undefined` (not empty string) so the edge function uses proper caption logic
- Validate attachment URL is accessible before sending
- If attachment is missing/invalid, show clear error instead of silent failure

**3. Internal chat not working**

Root cause found: `useInternalChat.fetchConversations()` uses `internal_messages!inner` join (line 57). The `!inner` modifier means only conversations that have at least one message are returned. Out of 24 internal conversations, many have 0 messages and are completely invisible.

Additionally, when conversations DO have messages, the `!inner` join returns ALL messages embedded in the conversation object (not just the last one), which is wasteful and may cause performance issues.

**Fix:**
- Remove `!inner` join — fetch conversations without requiring messages to exist
- Remove the inline `internal_messages` select entirely (the last message is already fetched separately in the `Promise.all` block)
- This alone should restore visibility of all internal conversations

### Implementation Details

**File: `supabase/functions/send-whatsapp-message/index.ts`**
- Line 460: Change `chat/sendPresence` to `chat/updatePresence` for group presence
- Lines 169-170: Strengthen group detection to also check `recipientJid.includes('@g.us')`
- Add response body consumption for fetch calls that don't read the body

**File: `src/components/app/chat/ForwardMessageModal.tsx`**
- Line 99-101: When attachment exists, set `forwardContent` to `undefined` instead of empty string for proper edge function handling
- Add validation that attachment object has required fields before invoking send

**File: `src/hooks/useInternalChat.ts`**
- Lines 53-65: Change query from `internal_messages!inner(...)` to just `*` (remove inner join)
- This restores all 24 conversations to visibility regardless of message count

### Deployment
- Deploy updated `send-whatsapp-message` edge function
- Frontend changes rebuild automatically

