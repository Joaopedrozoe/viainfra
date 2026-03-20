

## Fix: Group Message Delivery + Real ACK-Based Confirmation

### Problem
1. **Group text messages don't actually deliver** — the `sendText` payload for groups lacks `delay: 1500`, causing Evolution API to return success (HTTP 200 + messageId) without actual delivery
2. **No real delivery confirmation** — the system marks messages as `sent` based on HTTP 200, but never updates status from actual WhatsApp ACK events. The `MESSAGES_UPDATE` event handler (`processMessageUpdate`) is used only for LID contact resolution, and **skips groups entirely** (line 1801)

### Changes

#### 1. Add `delay` to group text payload (`send-whatsapp-message/index.ts`)

Line 446-449: add `delay: 1500` to the group sendText payload. Also add it to the fallback `sendMessage` endpoint (line 472-474).

Set initial status to `pending` instead of `sent` in the metadata update (line 318).

#### 2. Rewrite `processMessageUpdate` in both webhooks to handle ACK events

Currently `processMessageUpdate` in `evolution-webhook/index.ts` (line 1795+) and `evolution-webhook-vialogistic/index.ts` (line 1809+) does LID resolution instead of tracking delivery status. 

**New behavior**: When `MESSAGES_UPDATE` arrives with ACK data (status field like `DELIVERY_ACK`, `READ`, `PLAYED`, or numeric status 2/3/4), find the message by `whatsappMessageId` in the messages table and update its `metadata.whatsappStatus` to the confirmed status.

This gives real delivery confirmation from WhatsApp, not just API acceptance.

**ACK status mapping** (Evolution API v2):
- `0` / `ERROR` → `failed`
- `1` / `PENDING` → `pending`  
- `2` / `SERVER_ACK` → `sent_confirmed` (server received)
- `3` / `DELIVERY_ACK` → `delivered` (arrived on device)
- `4` / `READ` → `read`
- `5` / `PLAYED` → `played` (audio/video)

The existing LID resolution logic will be preserved as a secondary function within the same handler.

**Groups are no longer skipped** — remove the `@g.us` skip at line 1801.

#### 3. Update frontend status display (`ChatWindow.tsx` / `MessageItem.tsx`)

Update the message status indicator to reflect the new granular statuses:
- `pending` → spinner
- `sent_confirmed` → single check  
- `delivered` → double check
- `read` → double check (blue)
- `failed` → red warning

#### 4. Deploy both webhooks + send-whatsapp-message

### Files Modified
| File | Change |
|------|--------|
| `supabase/functions/send-whatsapp-message/index.ts` | Add `delay: 1500` to group payload; set initial status to `pending` |
| `supabase/functions/evolution-webhook/index.ts` | Rewrite `processMessageUpdate` to track ACK + keep LID resolution |
| `supabase/functions/evolution-webhook-vialogistic/index.ts` | Same ACK tracking rewrite |
| `src/components/app/chat/MessageItem.tsx` | Display granular delivery statuses |

