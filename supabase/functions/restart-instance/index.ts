import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { instanceName = 'VIAINFRAOFICIAL', action = 'restart' } = await req.json().catch(() => ({}))
    
    console.log(`🔧 ${action} instance: ${instanceName}`)
    
    const results: any = { instanceName, action, steps: [] }
    
    // Step 1: Check current state
    const stateRes = await fetch(
      `${evolutionApiUrl}/instance/connectionState/${instanceName}`,
      {
        headers: { 'apikey': evolutionApiKey },
      }
    )
    const currentState = await stateRes.json()
    results.steps.push({ step: 'currentState', data: currentState })
    console.log('Current state:', JSON.stringify(currentState))
    
    if (action === 'restart') {
      // Step 2: Restart instance
      console.log('🔄 Restarting instance...')
      const restartRes = await fetch(
        `${evolutionApiUrl}/instance/restart/${instanceName}`,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey 
          },
        }
      )
      const restartData = await restartRes.text()
      results.steps.push({ step: 'restart', status: restartRes.status, data: restartData })
      console.log('Restart result:', restartRes.status, restartData)
      
      // Wait a bit
      await new Promise(r => setTimeout(r, 3000))
      
      // Step 3: Check new state
      const newStateRes = await fetch(
        `${evolutionApiUrl}/instance/connectionState/${instanceName}`,
        {
          headers: { 'apikey': evolutionApiKey },
        }
      )
      const newState = await newStateRes.json()
      results.steps.push({ step: 'newState', data: newState })
      console.log('New state:', JSON.stringify(newState))
      
      // 🔒 BLOQUEIO: NÃO alterar webhook da Evolution. Endpoints são gerenciados manualmente.
      console.log('⛔ Skip webhook reconfiguration (locked by policy).');
      results.steps.push({ step: 'webhook', skipped: true, reason: 'Webhook mutation disabled by policy — managed manually.' });
      const webhookUrl: string | null = null;

      
      // Update DB (sem tocar em webhook_url — gerenciado manualmente)
      await supabase
        .from('whatsapp_instances')
        .update({ 
          status: newState?.instance?.state || 'reconnecting',
          connection_state: newState?.instance?.state || 'reconnecting',
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName)

      
      results.success = true
      results.finalState = newState?.instance?.state
    }
    
    return new Response(JSON.stringify(results, null, 2), {
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
