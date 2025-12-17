import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  companyId?: string;
}

interface SmtpSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_security: string;
  from_email: string;
  from_name: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, companyId } = await req.json() as SendEmailRequest;

    if (!to || !subject || !html) {
      throw new Error('to, subject and html are required');
    }

    console.log(`📧 Sending email to: ${to}`);

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

    // Get SMTP settings
    let smtpSettings: SmtpSettings | null = null;

    if (companyId) {
      const { data, error } = await supabaseAdmin
        .from('smtp_settings')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching SMTP settings:', error);
      } else {
        smtpSettings = data;
      }
    }

    // If no company-specific settings, try to get any active settings
    if (!smtpSettings) {
      const { data, error } = await supabaseAdmin
        .from('smtp_settings')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching default SMTP settings:', error);
      } else {
        smtpSettings = data;
      }
    }

    if (!smtpSettings) {
      throw new Error('No SMTP settings configured. Please configure SMTP in Settings > Email.');
    }

    console.log(`📧 Using SMTP: ${smtpSettings.smtp_host}:${smtpSettings.smtp_port}`);

    // Configure SMTP client
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

    // Send email
    await client.send({
      from: smtpSettings.from_name 
        ? `${smtpSettings.from_name} <${smtpSettings.from_email}>` 
        : smtpSettings.from_email,
      to: to,
      subject: subject,
      content: "auto",
      html: html,
    });

    await client.close();

    console.log(`✅ Email sent successfully to: ${to}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email sent to ${to}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error sending email:', error);
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
