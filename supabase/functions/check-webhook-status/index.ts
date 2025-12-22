import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')!
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')!

  try {
    const { instanceName = 'VIAINFRAOFICIAL' } = await req.json().catch(() => ({}))
    
    console.log(`🔍 Checking webhook status for ${instanceName}`)
    
    // Get current webhook settings
    const webhookResponse = await fetch(
      `${evolutionApiUrl}/webhook/find/${instanceName}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
      }
    )
    
    const webhookData = await webhookResponse.json()
    console.log('Webhook settings:', JSON.stringify(webhookData, null, 2))
    
    // Get instance state
    const stateResponse = await fetch(
      `${evolutionApiUrl}/instance/connectionState/${instanceName}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
      }
    )
    
    const stateData = await stateResponse.json()
    console.log('Connection state:', JSON.stringify(stateData, null, 2))
    
    // Test sending a test event
    const targetUrl = 'https://xxojpfhnkxpbznbmhmua.supabase.co/functions/v1/evolution-webhook'
    
    return new Response(JSON.stringify({
      success: true,
      instanceName,
      webhookSettings: webhookData,
      connectionState: stateData,
      expectedWebhookUrl: targetUrl,
      webhookEnabled: webhookData?.enabled,
      webhookUrl: webhookData?.url,
      urlMatches: webhookData?.url === targetUrl
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
