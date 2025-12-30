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

    console.log('=== LISTANDO TODOS OS GRUPOS ===');
    
    const groupsResp = await fetch(`${evolutionUrl}/group/fetchAllGroups/${instanceName}`, {
      headers: { 'apikey': evolutionKey }
    });
    
    const groupsData = await groupsResp.json();
    console.log(`Total de grupos: ${Array.isArray(groupsData) ? groupsData.length : 'N/A'}`);
    
    const groups = Array.isArray(groupsData) ? groupsData.map((g: any) => ({
      id: g.id,
      subject: g.subject,
      size: g.size
    })) : [];
    
    console.log('Grupos encontrados:', JSON.stringify(groups, null, 2));

    return new Response(JSON.stringify({
      success: true,
      totalGroups: groups.length,
      groups
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
