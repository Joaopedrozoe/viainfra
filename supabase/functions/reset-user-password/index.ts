import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, newEmail } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    if (!password && !newEmail) {
      throw new Error('Either password or newEmail is required');
    }

    // Initialize Supabase Admin Client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Find user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    // Update user password and/or email
    const updatePayload: any = {};
    if (password) {
      updatePayload.password = password;
    }
    if (newEmail) {
      updatePayload.email = newEmail;
    }

    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      updatePayload
    );

    if (updateError) {
      throw updateError;
    }

    // Also update profiles table if email changed
    if (newEmail) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ email: newEmail })
        .eq('user_id', user.id);
      
      if (profileError) {
        console.error('Failed to update profile email:', profileError);
      }
    }

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: newEmail 
          ? `Password and email updated for ${email} -> ${newEmail}`
          : `Password updated for ${email}`,
        userId: user.id,
        newEmail: newEmail || email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error resetting password:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
