import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL = 'gestao@vialogistic.com.br';
const PASSWORD = 'atendimento@26';
const NAME = 'Gestão';
const VIAINFRA_ID = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';
const VIALOGISTIC_ID = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // find or create auth user
    const { data: list } = await admin.auth.admin.listUsers();
    let user = list.users.find(u => u.email === EMAIL);
    if (user) {
      await admin.auth.admin.updateUserById(user.id, { password: PASSWORD, email_confirm: true });
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: EMAIL, password: PASSWORD, email_confirm: true, user_metadata: { name: NAME },
      });
      if (error) throw error;
      user = data.user;
    }

    // profile - primary company VIALOGISTIC
    const { data: prof } = await admin.from('profiles').select('id').eq('user_id', user!.id).maybeSingle();
    if (prof) {
      await admin.from('profiles').update({
        company_id: VIALOGISTIC_ID, name: NAME, email: EMAIL, role: 'user', permissions: ['read','write'],
      }).eq('user_id', user!.id);
    } else {
      await admin.from('profiles').insert({
        user_id: user!.id, company_id: VIALOGISTIC_ID, name: NAME, email: EMAIL, role: 'user', permissions: ['read','write'],
      });
    }

    // company_access for both companies
    for (const cid of [VIAINFRA_ID, VIALOGISTIC_ID]) {
      const { data: existing } = await admin.from('company_access')
        .select('id').eq('user_id', user!.id).eq('company_id', cid).maybeSingle();
      if (!existing) {
        await admin.from('company_access').insert({ user_id: user!.id, company_id: cid });
      }
    }

    return new Response(JSON.stringify({ success: true, userId: user!.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
