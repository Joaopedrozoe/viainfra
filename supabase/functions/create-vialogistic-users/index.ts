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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const users = [
      { 
        email: 'joicy.souza@vialogistic.com.br', 
        password: 'atendimento@26',
        profileId: '56b77266-5aa2-4f54-a54a-1459f63401fb'
      },
      { 
        email: 'suelem.souza@vialogistic.com.br', 
        password: 'atendimento@26',
        profileId: 'a6b24db2-6899-4320-ada1-4038897ff60e'
      },
    ]

    const results = []

    for (const u of users) {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      })

      if (authError) {
        // If user already exists, try to get their ID
        if (authError.message?.includes('already been registered')) {
          const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers()
          const existing = existingUsers?.find(eu => eu.email === u.email)
          if (existing) {
            // Update the profile to point to this user
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ user_id: existing.id })
              .eq('id', u.profileId)

            results.push({ 
              email: u.email, 
              status: 'exists_linked', 
              userId: existing.id,
              updateError: updateError?.message 
            })
          } else {
            results.push({ email: u.email, status: 'error', error: 'User exists but not found in list' })
          }
          continue
        }
        results.push({ email: u.email, status: 'error', error: authError.message })
        continue
      }

      // Update the VIALOGISTIC profile to point to the new user_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ user_id: authData.user.id })
        .eq('id', u.profileId)

      results.push({ 
        email: u.email, 
        status: 'created', 
        userId: authData.user.id,
        profileUpdated: !updateError,
        updateError: updateError?.message
      })
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})