import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyCodeRequest {
  email: string;
  code: string;
  newPassword: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, newPassword } = await req.json() as VerifyCodeRequest;

    if (!email || !code || !newPassword) {
      throw new Error('Email, code and newPassword are required');
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    console.log(`🔐 Verifying reset code for: ${email}`);

    // Initialize Supabase Admin Client
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
      throw new Error('Service error');
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error('Invalid code or email');
    }

    // Verify code
    const storedCode = user.user_metadata?.reset_code;
    const codeExpiry = user.user_metadata?.reset_code_expiry;

    if (!storedCode || !codeExpiry) {
      throw new Error('No reset code found. Please request a new one.');
    }

    if (new Date() > new Date(codeExpiry)) {
      throw new Error('Reset code has expired. Please request a new one.');
    }

    if (storedCode !== code) {
      throw new Error('Invalid reset code');
    }

    // Code is valid - update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: {
        ...user.user_metadata,
        reset_code: null,
        reset_code_expiry: null,
      }
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw new Error('Failed to update password');
    }

    console.log(`✅ Password reset successful for: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password updated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error verifying reset code:', error);
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
