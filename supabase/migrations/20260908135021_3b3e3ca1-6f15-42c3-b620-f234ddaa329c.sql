REVOKE EXECUTE ON FUNCTION public.claim_call(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enqueue_ai_learning_job() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_company_ids(uuid) FROM PUBLIC, anon;