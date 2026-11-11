import { createClient } from 'npm:@supabase/supabase-js@2';
export async function authorizeCompany(req: Request, companyId: string) {
  const client = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_ANON_KEY') || '', {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
  });
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error('AUTH_REQUIRED');
  const { data, error: accessError } = await client.from('companies').select('id').eq('id', companyId).maybeSingle();
  if (accessError || !data) throw new Error('COMPANY_FORBIDDEN');
  return user.id;
}