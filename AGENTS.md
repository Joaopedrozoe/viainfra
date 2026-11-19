# Architecture rules

- Use unique Realtime channel names per engine lifetime and discard responses from obsolete company contexts to prevent route-remount crashes and cross-company state.
- Broadcasts use durable recipient claims and never replay uncertain delivery outcomes automatically; Meta message IDs are the source of delivery status.
- Parse broadcast delivery metadata defensively and catch history refresh failures locally so incomplete records or network interruptions do not escape into the page.

- Derive manifest and Apple touch icons from the user-selected installation image, padding to square without stretching; preserve the website favicon when a separate installation image is requested.
- Share map-coordinate parsing between chat and the authenticated map-link resolver; resolve only allowlisted map URLs with bounded redirects, time and response size to avoid arbitrary network access.
- Both template pickers derive Vialogistic campaign images from the shared exact-name mapping; never retain a prior image or default an unknown template to the first image.
- Treat only the explicit official WhatsApp unsupported-number-lookup response as unavailable, not confirmed; format-validated broadcasts may proceed while other validation failures remain blocked.
- External backup lives in `supabase/functions/backup-export-schema/` (ported from T.INFORMATICA); runs are `complete` only after the receiver confirms the manifest SHA-256, scheduling uses one exact-time pg_cron job rewritten by `apply_backup_schedule`, and the receiver folder name comes from the `BACKUP_PROJECT_ID` secret.
- Reconcile uncertain backup finalization through one-shot checks and before status/start/scheduled operations; release unconfirmed runs as incomplete after a bounded grace period, never as validated, so uncertainty cannot block future backups forever.
- Empty-chat synchronization retries the initial page under the synchronization lock; keep conversation guards and message deduplication so recovery does not mix contexts or replay messages.
- Merge template catalogs by exact name/language with the current same-company Meta result overriding older Evolution metadata, so newly approved image templates are not hidden by stale duplicates.
