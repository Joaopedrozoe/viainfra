import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode = 'recent', limit = 50, forceAll = false } = await req.json().catch(() => ({}));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    
    if (!evolutionApiUrl || !evolutionApiKey) {
      throw new Error('Evolution API credentials not configured');
    }

    // Buscar instância conectada
    const instancesResp = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
      headers: { 'apikey': evolutionApiKey }
    });
    const instances = await instancesResp.json();
    
    const connectedInstance = instances.find((i: any) => 
      (i.instance?.state || i.state) === 'open' || 
      (i.instance?.state || i.state) === 'connected'
    );
    
    const instanceName = connectedInstance?.instance?.instanceName || 
                         connectedInstance?.instanceName || 
                         instances[0]?.instance?.instanceName ||
                         instances[0]?.instanceName;

    if (!instanceName) {
      // Gracefully handle no instance - return success with info instead of error
      console.log('⚠️ Nenhuma instância WhatsApp disponível - pulando sync de avatares');
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: 'Nenhuma instância WhatsApp conectada',
          summary: { total: 0, updated: 0, failed: 0, skipped: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 Usando instância: ${instanceName}`);

    // Buscar contatos que precisam de atualização
    let query = supabase
      .from('contacts')
      .select('id, name, phone, avatar_url, metadata, updated_at');

    if (mode === 'missing') {
      // Contatos sem avatar
      query = query.is('avatar_url', null);
    } else if (mode === 'outdated') {
      // Contatos com avatar desatualizado (> 7 dias)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.lt('updated_at', sevenDaysAgo);
    } else if (mode === 'recent') {
      // Contatos com interação recente
      query = query.order('updated_at', { ascending: false });
    }

    const { data: contacts, error: contactsError } = await query.limit(limit);

    if (contactsError) throw contactsError;

    console.log(`📋 Processando ${contacts?.length || 0} contatos...`);

    const results = {
      success: [] as string[],
      failed: [] as { id: string; name: string; reason: string }[],
      skipped: [] as string[]
    };

    for (const contact of contacts || []) {
      try {
        // Verificar se é grupo ou contato normal
        const isGroup = contact.metadata?.isGroup === true || 
                        contact.metadata?.remoteJid?.includes('@g.us');

        let remoteJid: string;
        
        if (isGroup) {
          remoteJid = contact.metadata?.remoteJid;
          if (!remoteJid) {
            results.skipped.push(`${contact.name}: grupo sem remoteJid`);
            continue;
          }
        } else {
          if (!contact.phone) {
            results.skipped.push(`${contact.name}: sem telefone`);
            continue;
          }
          remoteJid = contact.phone.includes('@') 
            ? contact.phone 
            : `${contact.phone}@s.whatsapp.net`;
        }

        // Buscar foto de perfil
        const profileResp = await fetch(
          `${evolutionApiUrl}/chat/fetchProfilePictureUrl/${instanceName}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey
            },
            body: JSON.stringify({ number: remoteJid })
          }
        );

        const profileData = await profileResp.json();
        const pictureUrl = profileData.profilePictureUrl || 
                          profileData.picture || 
                          profileData.imgUrl || 
                          profileData.url;

        if (!pictureUrl) {
          results.failed.push({ 
            id: contact.id, 
            name: contact.name, 
            reason: 'Foto não disponível' 
          });
          continue;
        }

        // Baixar imagem
        const imageResp = await fetch(pictureUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!imageResp.ok) {
          results.failed.push({ 
            id: contact.id, 
            name: contact.name, 
            reason: `Download falhou: ${imageResp.status}` 
          });
          continue;
        }

        const contentType = imageResp.headers.get('content-type') || 'image/jpeg';
        const imageBuffer = await imageResp.arrayBuffer();
        const blob = new Uint8Array(imageBuffer);

        let extension = 'jpg';
        if (contentType.includes('png')) extension = 'png';
        else if (contentType.includes('webp')) extension = 'webp';

        const fileName = `${contact.id}.${extension}`;

        // Upload para storage
        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, blob, {
            contentType,
            upsert: true,
          });

        if (uploadError) {
          results.failed.push({ 
            id: contact.id, 
            name: contact.name, 
            reason: uploadError.message 
          });
          continue;
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(fileName);

        const newAvatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

        // Atualizar contato
        await supabase
          .from('contacts')
          .update({ 
            avatar_url: newAvatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id);

        results.success.push(contact.name);
        console.log(`✅ ${contact.name}`);

        // Rate limiting - pequena pausa entre requests
        await new Promise(r => setTimeout(r, 200));

      } catch (err) {
        results.failed.push({ 
          id: contact.id, 
          name: contact.name, 
          reason: err.message 
        });
      }
    }

    console.log(`📊 Resultado: ${results.success.length} atualizados, ${results.failed.length} falharam, ${results.skipped.length} pulados`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: contacts?.length || 0,
          updated: results.success.length,
          failed: results.failed.length,
          skipped: results.skipped.length
        },
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
