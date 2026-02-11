import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, password, targetCompanyId } = await req.json()

    if (!email || !password || !targetCompanyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email, senha e empresa são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Use a separate client to verify credentials without affecting caller's session
    const tempClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: signInData, error: signInError } = await tempClient.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !signInData.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the authenticated user has a profile in the target company
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, name, email')
      .eq('user_id', signInData.user.id)
      .eq('company_id', targetCompanyId)
      .maybeSingle()

    // Sign out the temp session immediately
    await tempClient.auth.signOut()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não tem acesso a esta empresa' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, profile: { name: profile.name, email: profile.email } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})