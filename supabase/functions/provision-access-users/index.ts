import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VIAINFRA_ID = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';
const VIALOGISTIC_ID = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const results: unknown[] = [];
  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

    const grantAccess = async (userId: string, companyIds: string[]) => {
      for (const cid of companyIds) {
        const { data: existing } = await admin.from('company_access')
          .select('id').eq('user_id', userId).eq('company_id', cid).maybeSingle();
        if (!existing) {
          await admin.from('company_access').insert({ user_id: userId, company_id: cid });
        }
      }
    };

    // 1) André Rocha - atendente com acesso às duas empresas
    const ANDRE_EMAIL = 'andre.rocha@vialogistic.com.br';
    let andre = list.users.find(u => u.email === ANDRE_EMAIL);
    if (andre) {
      await admin.auth.admin.updateUserById(andre.id, {
        password: 'atendimento@26',
        email_confirm: true,
        user_metadata: { name: 'André Rocha' },
      });
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: ANDRE_EMAIL,
        password: 'atendimento@26',
        email_confirm: true,
        user_metadata: { name: 'André Rocha' },
      });
      if (error) throw error;
      andre = data.user!;
    }

    const { data: andreProfile } = await admin.from('profiles')
      .select('id').eq('user_id', andre.id).maybeSingle();
    const andrePayload = {
      company_id: VIALOGISTIC_ID,
      name: 'André Rocha',
      email: ANDRE_EMAIL,
      role: 'user',
      permissions: ['read', 'write'],
    };
    if (andreProfile) {
      await admin.from('profiles').update(andrePayload).eq('user_id', andre.id);
    } else {
      await admin.from('profiles').insert({ user_id: andre.id, ...andrePayload });
    }
    await grantAccess(andre.id, [VIAINFRA_ID, VIALOGISTIC_ID]);
    results.push({ email: ANDRE_EMAIL, userId: andre.id, status: 'ok', companies: ['VIAINFRA', 'VIALOGISTIC'] });

    // 2) Sandra Romano - manter acesso VIAINFRA e liberar VIALOGISTIC
    const SANDRA_EMAIL = 'sandra.romano@viainfra.com.br';
    const sandra = list.users.find(u => u.email === SANDRA_EMAIL);
    if (!sandra) {
      results.push({ email: SANDRA_EMAIL, status: 'not_found' });
    } else {
      await grantAccess(sandra.id, [VIAINFRA_ID, VIALOGISTIC_ID]);
      results.push({ email: SANDRA_EMAIL, userId: sandra.id, status: 'ok', companies: ['VIAINFRA', 'VIALOGISTIC'] });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message, results }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
