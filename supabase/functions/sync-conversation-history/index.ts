import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { conversationId, limit = 100 } = await req.json();

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📥 [SYNC-HISTORY] Iniciando sync para conversa: ${conversationId}`);

    // 1. Buscar dados da conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, channel, metadata, contact_id, contacts(phone, name, metadata)')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('❌ Conversa não encontrada:', convError);
      return new Response(
        JSON.stringify({ error: 'Conversa não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Só funciona para WhatsApp
    if (conversation.channel !== 'whatsapp') {
      return new Response(
        JSON.stringify({ success: true, message: 'Sync só disponível para WhatsApp', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(
        JSON.stringify({ error: 'Evolution API não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Extrair remoteJid
    const convMetadata = conversation.metadata as Record<string, unknown> | null;
    const contactData = conversation.contacts as { phone?: string; name?: string; metadata?: Record<string, unknown> } | null;
    
    let remoteJid = convMetadata?.remoteJid as string || '';
    
    // Tentar extrair do contato se não tiver na conversa
    if (!remoteJid && contactData?.phone) {
      remoteJid = `${contactData.phone}@s.whatsapp.net`;
    }
    if (!remoteJid && contactData?.metadata?.remoteJid) {
      remoteJid = contactData.metadata.remoteJid as string;
    }

    if (!remoteJid) {
      console.error('❌ remoteJid não encontrado');
      return new Response(
        JSON.stringify({ error: 'remoteJid não encontrado para esta conversa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const instanceName = convMetadata?.instanceName as string || 'VIAINFRAOFICIAL';
    console.log(`📡 [SYNC-HISTORY] remoteJid: ${remoteJid}, instance: ${instanceName}`);

    // 3. Buscar IDs de mensagens já existentes para evitar duplicatas
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId);

    const existingIds = new Set<string>();
    existingMessages?.forEach((msg: any) => {
      if (msg.metadata?.external_id) existingIds.add(msg.metadata.external_id);
      if (msg.metadata?.messageId) existingIds.add(msg.metadata.messageId);
      if (msg.metadata?.key?.id) existingIds.add(msg.metadata.key.id);
    });

    console.log(`📊 [SYNC-HISTORY] ${existingIds.size} mensagens já existentes`);

    // 4. Buscar mensagens da Evolution API
    let apiMessages: any[] = [];
    
    // Tentar múltiplos endpoints
    const endpoints = [
      {
        url: `${evolutionApiUrl}/chat/findMessages/${instanceName}`,
        method: 'POST',
        body: JSON.stringify({ where: { key: { remoteJid } }, limit })
      },
      {
        url: `${evolutionApiUrl}/chat/fetchHistory/${instanceName}`,
        method: 'POST',
        body: JSON.stringify({ remoteJid, limit })
      }
    ];

    for (const endpoint of endpoints) {
      if (apiMessages.length > 0) break;
      
      try {
        console.log(`📡 Tentando: ${endpoint.url}`);
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: { 
            'apikey': evolutionApiKey, 
            'Content-Type': 'application/json' 
          },
          body: endpoint.body
        });

        if (response.ok) {
          const data = await response.json();
          apiMessages = Array.isArray(data) ? data : 
            (data?.messages?.records || data?.messages || data?.data || []);
          console.log(`✅ ${apiMessages.length} mensagens encontradas`);
        }
      } catch (err) {
        console.log(`❌ Erro no endpoint: ${err}`);
      }
    }

    if (apiMessages.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma mensagem nova encontrada', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Processar e inserir mensagens novas
    let inserted = 0;
    let skipped = 0;

    for (const msg of apiMessages) {
      const messageId = msg.key?.id || msg.id || msg.messageId;
      
      // Verificar duplicata
      if (existingIds.has(messageId)) {
        skipped++;
        continue;
      }

      // Extrair conteúdo
      const content = extractContent(msg);
      if (!content) continue;

      // Extrair timestamp
      const timestamp = msg.messageTimestamp 
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      // Inserir mensagem
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: msg.key?.fromMe ? 'agent' : 'user',
          content,
          created_at: timestamp,
          metadata: {
            external_id: messageId,
            messageId,
            key: msg.key,
            source: 'sync-conversation-history',
            syncedAt: new Date().toISOString()
          }
        });

      if (!insertError) {
        inserted++;
        existingIds.add(messageId); // Evitar duplicatas no mesmo batch
      } else {
        console.log(`❌ Erro ao inserir mensagem: ${insertError.message}`);
      }
    }

    console.log(`✅ [SYNC-HISTORY] Sync completo: ${inserted} novas, ${skipped} ignoradas`);

    // 6. Atualizar updated_at da conversa para refresh na UI
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: inserted, 
        skipped,
        total: apiMessages.length,
        remoteJid 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 [SYNC-HISTORY] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função para extrair conteúdo da mensagem
function extractContent(msg: any): string {
  if (!msg?.message) return '';
  
  const m = msg.message;
  
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return `[Imagem] ${m.imageMessage.caption}`;
  if (m.imageMessage) return '[Imagem]';
  if (m.videoMessage?.caption) return `[Vídeo] ${m.videoMessage.caption}`;
  if (m.videoMessage) return '[Vídeo]';
  if (m.audioMessage) return m.audioMessage.ptt ? '[Áudio]' : '[Arquivo de áudio]';
  if (m.documentMessage) return `[Documento] ${m.documentMessage.fileName || m.documentMessage.title || ''}`;
  if (m.stickerMessage) return '[Figurinha]';
  if (m.contactMessage) return `[Contato] ${m.contactMessage.displayName || ''}`;
  if (m.locationMessage) return '[Localização]';
  if (m.reactionMessage) return '';
  
  return '';
}
