

## Problem

When switching to VIALOGISTIC, the Channels page shows **no cards at all** because:

1. `getDemoChannelsExpanded()` returns `[]` for any company that isn't VIAINFRA (line 291)
2. The `WhatsAppInstanceManager` component is only accessible through a WhatsApp channel card's settings menu (line 397-398)
3. No card = no way to access WhatsApp instance creation/QR code for VIALOGISTIC

The frontend filtering rules in `useWhatsAppInstances.ts` and `whatsapp-rules.ts` are already correct — VIALOGISTIC only sees instances with "VIALOGISTIC" in the name. No changes needed there.

## Solution

Show the `WhatsAppInstanceManager` **directly on the Channels page**, always visible, independent of demo channel cards. This gives every company immediate access to create/manage WhatsApp instances without needing a pre-existing demo card.

### Changes

**`src/pages/app/Channels.tsx`**
- Add `WhatsAppInstanceManager` as a dedicated section at the top of the page, rendered unconditionally (before the demo channel cards grid)
- This ensures VIALOGISTIC (and any future company) can immediately create a WhatsApp instance and scan QR code

No Edge Function changes. No changes to VIAINFRA. The master rule filtering already works correctly in the hook.

