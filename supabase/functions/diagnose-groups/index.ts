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

    console.log('=== DIAGNÓSTICO COMPLETO DA INSTÂNCIA ===');
    const results: Record<string, any> = {};
    
    // 1. Estado da conexão
    console.log('\n1️⃣ Verificando estado da conexão...');
    const stateResp = await fetch(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': evolutionKey }
    });
    results.connectionState = await stateResp.json();
    console.log('Estado:', JSON.stringify(results.connectionState));

    // 2. Informações da instância
    console.log('\n2️⃣ Buscando info da instância...');
    const infoResp = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
      headers: { 'apikey': evolutionKey }
    });
    const instances = await infoResp.json();
    results.instanceInfo = instances?.find?.((i: any) => i.name === instanceName || i.instanceName === instanceName);
    console.log('Info:', JSON.stringify(results.instanceInfo));

    // 3. Grupos com getParticipants=false (mais rápido)
    console.log('\n3️⃣ Buscando grupos (sem participantes)...');
    const groupsResp = await fetch(`${evolutionUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
      headers: { 'apikey': evolutionKey }
    });
    const groupsData = await groupsResp.json();
    results.groupsCount = Array.isArray(groupsData) ? groupsData.length : 0;
    if (Array.isArray(groupsData) && groupsData.length > 0) {
      results.sampleGroups = groupsData.slice(0, 5).map((g: any) => ({ id: g.id, subject: g.subject }));
    }
    console.log('Grupos encontrados:', results.groupsCount);

    // 4. Buscar grupo específico por JID
    const targetJid = '120363421810878254@g.us';
    console.log(`\n4️⃣ Buscando grupo específico: ${targetJid}...`);
    const specificGroupResp = await fetch(`${evolutionUrl}/group/findGroupInfos/${instanceName}?groupJid=${targetJid}`, {
      headers: { 'apikey': evolutionKey }
    });
    const specificGroupText = await specificGroupResp.text();
    console.log('Grupo específico:', specificGroupResp.status, specificGroupText);
    results.specificGroup = { status: specificGroupResp.status, response: specificGroupText };

    // 5. Tentar reiniciar webhook para forçar reconexão de grupos
    console.log('\n5️⃣ Listando webhooks...');
    const webhookResp = await fetch(`${evolutionUrl}/webhook/find/${instanceName}`, {
      headers: { 'apikey': evolutionKey }
    });
    results.webhook = await webhookResp.json();
    console.log('Webhook:', JSON.stringify(results.webhook));

    // 6. Chats recentes (pode incluir grupos)
    console.log('\n6️⃣ Buscando chats recentes...');
    const chatsResp = await fetch(`${evolutionUrl}/chat/findChats/${instanceName}`, {
      headers: { 'apikey': evolutionKey }
    });
    const chatsData = await chatsResp.json();
    if (Array.isArray(chatsData)) {
      results.totalChats = chatsData.length;
      results.groupChats = chatsData.filter((c: any) => c.id?.includes('@g.us')).slice(0, 10).map((c: any) => ({
        id: c.id,
        name: c.name || c.subject
      }));
    }
    console.log('Chats totais:', results.totalChats);
    console.log('Grupos em chats:', results.groupChats?.length || 0);

    return new Response(JSON.stringify({
      success: true,
      instanceName,
      ...results
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
