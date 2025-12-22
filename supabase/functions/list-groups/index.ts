import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';
    const instanceName = 'VIAINFRAOFICIAL';

    console.log('Fetching groups from Evolution API...');

    // Listar todos os grupos que a instância participa
    const response = await fetch(`${evolutionUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
    });

    const responseText = await response.text();
    console.log('Evolution API response:', response.status, responseText);

    let groups = [];
    try {
      groups = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', e);
    }

    // Buscar grupos específicos que estamos testando
    const testGroupIds = [
      '120363421810878254@g.us', // Via & T.Informatica
      '120363419895785754@g.us', // VIAINFRA-FINANCEIRO
    ];

    const foundGroups = groups.filter?.((g: any) => 
      testGroupIds.includes(g.id) || testGroupIds.includes(g.jid)
    ) || [];

    return new Response(
      JSON.stringify({ 
        success: response.ok,
        totalGroups: groups.length || 0,
        groups: groups.slice?.(0, 10) || groups,
        foundTestGroups: foundGroups,
        raw: responseText.substring(0, 1000)
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
