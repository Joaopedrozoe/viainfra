
REVOKE EXECUTE ON FUNCTION public.bot_http_fetch(text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_typing_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_ai_learning_job() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reconcile_call_into_messages() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reconcile_unsupported_with_call() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_conversation_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assert_repair_allowed() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.contacts_audit_summary(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.merge_duplicate_contacts(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.repair_contact_names(uuid, boolean, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.repair_contact_phones(uuid, boolean, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_call(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_inbox_previews(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_inbox_previews_compact(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bot_http_fetch(text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_typing_status() TO service_role;
ALTER FUNCTION public.call_log_label(text, integer) SET search_path = public;
