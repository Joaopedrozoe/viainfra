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

    const oldEmail = 'sandra.romano@vialogistic.com.br'
    const newEmail = 'eliane.furtado@vialogistic.com.br'
    const newName = 'Eliane Furtado'
    const password = 'atendimento@26'

    // 1. Find the existing auth user
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const existingUser = users?.find(u => u.email === oldEmail)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      console.log(`Found existing user ${oldEmail} with ID ${userId}`)

      // Update auth user email, name, and password
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        email: newEmail,
        password: password,
        email_confirm: true,
        user_metadata: { name: newName },
      })

      if (updateError) {
        console.error('Error updating auth user:', updateError)
        throw updateError
      }
      console.log(`Auth user updated to ${newEmail}`)
    } else {
      // User doesn't exist with old email, check if new email already exists
      const existingNew = users?.find(u => u.email === newEmail)
      if (existingNew) {
        userId = existingNew.id
        console.log(`User ${newEmail} already exists with ID ${userId}`)
        // Just update password and metadata
        await supabase.auth.admin.updateUserById(userId, {
          password: password,
          email_confirm: true,
          user_metadata: { name: newName },
        })
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: newEmail,
          password: password,
          email_confirm: true,
          user_metadata: { name: newName },
        })
        if (createError) throw createError
        userId = newUser.user.id
        console.log(`Created new user ${newEmail} with ID ${userId}`)
      }
    }

    // 2. Update profile record
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        name: newName,
        email: newEmail,
      })
      .eq('user_id', userId)
      .select()

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }

    // Also check by old email in case user_id doesn't match
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .update({
        name: newName,
        email: newEmail,
      })
      .eq('email', oldEmail)
      .select()

    return new Response(JSON.stringify({
      success: true,
      userId,
      newEmail,
      newName,
      profileUpdated: profile || profileByEmail,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
