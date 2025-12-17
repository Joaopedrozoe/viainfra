import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json() as PasswordResetRequest;

    if (!email) {
      throw new Error('Email is required');
    }

    console.log(`🔐 Password reset requested for: ${email}`);

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

    // Check if user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      // Don't reveal if user exists or not
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'If the email exists, a reset link has been sent.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log(`User not found: ${email}`);
      // Don't reveal if user exists - security best practice
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'If the email exists, a reset link has been sent.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get user's company to find SMTP settings
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get SMTP settings
    let smtpSettings: any = null;
    
    if (profile?.company_id) {
      const { data } = await supabaseAdmin
        .from('smtp_settings')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .maybeSingle();
      smtpSettings = data;
    }

    // Fallback to any active SMTP
    if (!smtpSettings) {
      const { data } = await supabaseAdmin
        .from('smtp_settings')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      smtpSettings = data;
    }

    if (!smtpSettings) {
      console.error('No SMTP settings configured');
      throw new Error('Email service not configured. Contact administrator.');
    }

    // Generate reset token (6 digit code)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

    // Store reset code in user metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        reset_code: resetCode,
        reset_code_expiry: resetExpiry,
      }
    });

    if (updateError) {
      console.error('Error storing reset code:', updateError);
      throw new Error('Failed to generate reset code');
    }

    // Build reset email HTML
    const resetUrl = `${req.headers.get('origin') || 'https://chatvia.viainfra.com.br'}/auth?reset=true&email=${encodeURIComponent(email)}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .code { background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Redefinição de Senha</h1>
          </div>
          <p>Olá,</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta associada a este e-mail.</p>
          <p>Seu código de verificação é:</p>
          <div class="code">${resetCode}</div>
          <p>Este código expira em <strong>30 minutos</strong>.</p>
          <p>Se você não solicitou esta redefinição, ignore este e-mail.</p>
          <div class="footer">
            <p>Este é um e-mail automático, por favor não responda.</p>
            <p>© ${new Date().getFullYear()} ViaInfra - Todos os direitos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via SMTP
    console.log(`📧 Sending reset email via ${smtpSettings.smtp_host}`);
    
    const client = new SMTPClient({
      connection: {
        hostname: smtpSettings.smtp_host,
        port: smtpSettings.smtp_port,
        tls: smtpSettings.smtp_security === 'TLS' || smtpSettings.smtp_security === 'SSL',
        auth: {
          username: smtpSettings.smtp_user,
          password: smtpSettings.smtp_password,
        },
      },
    });

    await client.send({
      from: smtpSettings.from_name 
        ? `${smtpSettings.from_name} <${smtpSettings.from_email}>` 
        : smtpSettings.from_email,
      to: email,
      subject: 'Redefinição de Senha - ChatVia',
      content: "auto",
      html: html,
    });

    await client.close();

    console.log(`✅ Reset email sent to: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Reset code sent to your email.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error in password reset:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
