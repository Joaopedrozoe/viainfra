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
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const instanceName = 'VIAINFRA2';

    console.log('🔍 Iniciando diagnóstico completo...');
    console.log('Evolution API URL:', evolutionApiUrl);

    const diagnostico = {
      timestamp: new Date().toISOString(),
      tests: [] as any[],
    };

    // 1. Verificar instância
    console.log('\n📱 1. Verificando instância...');
    try {
      const instanceResponse = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
        headers: { 'apikey': evolutionApiKey! }
      });
      const instances = await instanceResponse.json();
      const instance = instances.find((i: any) => i.instance?.instanceName === instanceName);
      
      diagnostico.tests.push({
        test: 'Instância',
        status: instance ? 'OK' : 'ERRO',
        data: instance || 'Instância não encontrada',
      });
      console.log('✅ Instância:', JSON.stringify(instance, null, 2));
    } catch (error) {
      diagnostico.tests.push({
        test: 'Instância',
        status: 'ERRO',
        error: error.message,
      });
      console.error('❌ Erro ao buscar instância:', error);
    }

    // 2. Verificar webhook configurado
    console.log('\n🔗 2. Verificando webhook configurado...');
    try {
      const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/find/${instanceName}`, {
        headers: { 'apikey': evolutionApiKey! }
      });
      const webhookConfig = await webhookResponse.json();
      
      diagnostico.tests.push({
        test: 'Webhook Config',
        status: webhookConfig.enabled ? 'OK' : 'DESABILITADO',
        data: webhookConfig,
      });
      console.log('✅ Webhook Config:', JSON.stringify(webhookConfig, null, 2));

      // Verificar eventos específicos
      const eventsCheck = {
        MESSAGES_UPSERT: webhookConfig.events?.includes('MESSAGES_UPSERT') || 
                         webhookConfig.events?.includes('messages.upsert'),
        CONNECTION_UPDATE: webhookConfig.events?.includes('CONNECTION_UPDATE') ||
                          webhookConfig.events?.includes('connection.update'),
      };
      
      diagnostico.tests.push({
        test: 'Eventos Configurados',
        status: eventsCheck.MESSAGES_UPSERT ? 'OK' : 'FALTANDO',
        data: eventsCheck,
      });
      console.log('📋 Eventos:', JSON.stringify(eventsCheck, null, 2));

    } catch (error) {
      diagnostico.tests.push({
        test: 'Webhook Config',
        status: 'ERRO',
        error: error.message,
      });
      console.error('❌ Erro ao buscar webhook:', error);
    }

    // 3. Forçar reconfiguração do webhook
    console.log('\n🔧 3. Reconfigurando webhook...');
    try {
      const webhookSetResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': evolutionApiKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: true,
          url: 'https://xxojpfhnkxpbznbmhmua.supabase.co/functions/v1/evolution-webhook',
          webhookByEvents: false,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE', 
            'CONNECTION_UPDATE',
            'SEND_MESSAGE',
          ],
        }),
      });
      
      const setResult = await webhookSetResponse.json();
      diagnostico.tests.push({
        test: 'Reconfigurar Webhook',
        status: webhookSetResponse.ok ? 'OK' : 'ERRO',
        data: setResult,
      });
      console.log('✅ Webhook reconfigurado:', JSON.stringify(setResult, null, 2));
    } catch (error) {
      diagnostico.tests.push({
        test: 'Reconfigurar Webhook',
        status: 'ERRO',
        error: error.message,
      });
      console.error('❌ Erro ao reconfigurar webhook:', error);
    }

    // 4. Testar envio de mensagem de teste
    console.log('\n📤 4. Enviando mensagem de teste...');
    try {
      const testNumber = '5511950025503'; // Seu número de teste
      const testResponse = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': evolutionApiKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: testNumber,
          text: '🧪 TESTE DE DIAGNÓSTICO - ' + new Date().toISOString(),
        }),
      });
      
      const sendResult = await testResponse.json();
      diagnostico.tests.push({
        test: 'Enviar Mensagem Teste',
        status: testResponse.ok ? 'OK' : 'ERRO',
        data: sendResult,
      });
      console.log('✅ Mensagem teste enviada:', JSON.stringify(sendResult, null, 2));
    } catch (error) {
      diagnostico.tests.push({
        test: 'Enviar Mensagem Teste',
        status: 'ERRO',
        error: error.message,
      });
      console.error('❌ Erro ao enviar mensagem teste:', error);
    }

    // 5. Restart da instância
    console.log('\n🔄 5. Reiniciando instância...');
    try {
      const restartResponse = await fetch(`${evolutionApiUrl}/instance/restart/${instanceName}`, {
        method: 'PUT',
        headers: { 'apikey': evolutionApiKey! }
      });
      
      const restartResult = await restartResponse.json();
      diagnostico.tests.push({
        test: 'Restart Instância',
        status: restartResponse.ok ? 'OK' : 'ERRO',
        data: restartResult,
      });
      console.log('✅ Instância reiniciada:', JSON.stringify(restartResult, null, 2));
    } catch (error) {
      diagnostico.tests.push({
        test: 'Restart Instância',
        status: 'ERRO',
        error: error.message,
      });
      console.error('❌ Erro ao reiniciar instância:', error);
    }

    console.log('\n📊 DIAGNÓSTICO COMPLETO:');
    console.log(JSON.stringify(diagnostico, null, 2));

    return new Response(JSON.stringify(diagnostico, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ ERRO FATAL:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
