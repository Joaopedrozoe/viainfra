

## Problem: VIALOGISTIC Inbox Empty - Wrong company_id Assignment

The VIALOGISTICOFICIAL instance in the `whatsapp_instances` table has `company_id = da17735c-5a76-4797-b338-f6e63a7b3f8b` (VIAINFRA) instead of `company_id = e3ad9c68-cf12-4e39-a12d-3f3068e975a0` (VIALOGISTIC).

This means:
- The webhook creates all conversations and contacts under VIAINFRA's company_id
- 18 conversations already exist with VIALOGISTICOFICIAL data, but assigned to VIAINFRA
- When logged into VIALOGISTIC, the inbox query filters by VIALOGISTIC's company_id and finds 0 results
- The `realtime-sync` also uses the instance's company_id from the database, so it routes everything to VIAINFRA

## Root Cause

When the instance was created via `WhatsAppInstanceManager`, the user was authenticated with their primary profile (VIAINFRA). The `evolution-instance` function or the RLS policy assigned the instance to the user's default company_id (VIAINFRA) rather than the currently active company (VIALOGISTIC).

## Solution

### 1. Database Migration: Reassign VIALOGISTIC Data

A single SQL migration to:

1. **Fix the instance**: Update `whatsapp_instances` to set `company_id = e3ad9c68-cf12-4e39-a12d-3f3068e975a0` for VIALOGISTICOFICIAL
2. **Move 18 conversations**: Update all conversations where `metadata->>'instanceName' = 'VIALOGISTICOFICIAL'` to have the correct VIALOGISTIC company_id
3. **Move contacts**: Update associated contacts to belong to VIALOGISTIC

### 2. Fix Instance Creation Logic

Modify `WhatsAppInstanceManager` to pass the currently active `company.id` from the auth context when creating instances, so future instances are assigned to the correct company. Currently, the RLS policy uses the user's profile company_id which defaults to VIAINFRA.

### 3. Fix `evolution-instance` Edge Function

Update the create handler to accept and use a `companyId` parameter from the frontend, ensuring new instances are correctly assigned to the active company context.

### Changes Summary

| File | Change |
|------|--------|
| Database migration | Reassign VIALOGISTICOFICIAL instance + 18 conversations + contacts to VIALOGISTIC company_id |
| `src/components/app/channels/WhatsAppInstanceManager.tsx` | Pass `company.id` when creating instance |
| `supabase/functions/evolution-instance/index.ts` | Accept `companyId` param in create handler |

No changes to VIAINFRA data or functionality. This fixes the inbox for VIALOGISTIC and prevents future mis-assignment.

