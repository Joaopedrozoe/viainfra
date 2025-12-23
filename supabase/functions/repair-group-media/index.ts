import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RepairResult {
  totalFound: number;
  processed: number;
  repaired: number;
  markedUnavailable: number;
  errors: number;
  details: Array<{
    id: string;
    status: 'repaired' | 'unavailable' | 'error';
    message: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔧 Starting group media repair process...');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.viainfra.chat';
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

  try {
    const body = await req.json().catch(() => ({}));
    const { dryRun = false, limit = 50 } = body;

    console.log(`📋 Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}, Limit: ${limit}`);

    // Find group messages with media placeholders but no attachment
    const { data: messagesWithMissingMedia, error: queryError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        metadata,
        created_at,
        conversation_id,
        conversations!inner(
          metadata,
          channel
        )
      `)
      .eq('conversations.channel', 'whatsapp')
      .is('metadata->attachment', null)
      .or('content.ilike.%[Imagem]%,content.ilike.%[Áudio%,content.ilike.%[Vídeo]%,content.ilike.%[Documento%')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (queryError) {
      console.error('❌ Error querying messages:', queryError);
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Filter to only group messages
    const groupMessages = (messagesWithMissingMedia || []).filter(msg => 
      msg.metadata?.isGroup === true
    );

    console.log(`📊 Found ${groupMessages.length} group messages with missing media`);

    const result: RepairResult = {
      totalFound: groupMessages.length,
      processed: 0,
      repaired: 0,
      markedUnavailable: 0,
      errors: 0,
      details: []
    };

    for (const msg of groupMessages) {
      result.processed++;
      const externalId = msg.metadata?.external_id;
      const groupId = msg.metadata?.groupId;
      const instanceName = msg.conversations?.metadata?.instanceName;

      console.log(`\n📩 Processing message ${msg.id}`);
      console.log(`   External ID: ${externalId}`);
      console.log(`   Group: ${groupId}`);
      console.log(`   Instance: ${instanceName}`);
      console.log(`   Content: ${msg.content?.substring(0, 50)}...`);

      // Determine media type from content
      let mediaType: 'image' | 'audio' | 'video' | 'document' = 'image';
      if (msg.content?.includes('[Áudio')) mediaType = 'audio';
      if (msg.content?.includes('[Vídeo]')) mediaType = 'video';
      if (msg.content?.includes('[Documento')) mediaType = 'document';

      // Try to recover media via Evolution API (usually fails for old messages)
      let recovered = false;
      let storageUrl: string | null = null;

      if (evolutionKey && instanceName && externalId && !dryRun) {
        try {
          // Attempt to get media from WhatsApp via Evolution API
          // Note: This usually only works for recent messages (< 24h)
          console.log('🔄 Attempting to recover media via Evolution API...');
          
          const mediaResponse = await fetch(
            `${evolutionUrl}/chat/findMessages/${instanceName}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionKey,
              },
              body: JSON.stringify({
                where: {
                  key: {
                    id: externalId
                  }
                }
              }),
            }
          );

          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            console.log('📨 Evolution API response:', JSON.stringify(mediaData).substring(0, 200));
            
            // Check if we got the message with media
            const foundMessage = mediaData?.messages?.[0];
            if (foundMessage?.message) {
              const msgContent = foundMessage.message;
              let mediaUrl: string | null = null;
              let mimeType: string | undefined;

              // Extract URL based on media type
              if (msgContent.imageMessage?.url) {
                mediaUrl = msgContent.imageMessage.url;
                mimeType = msgContent.imageMessage.mimetype;
              } else if (msgContent.audioMessage?.url) {
                mediaUrl = msgContent.audioMessage.url;
                mimeType = msgContent.audioMessage.mimetype;
              } else if (msgContent.videoMessage?.url) {
                mediaUrl = msgContent.videoMessage.url;
                mimeType = msgContent.videoMessage.mimetype;
              } else if (msgContent.documentMessage?.url) {
                mediaUrl = msgContent.documentMessage.url;
                mimeType = msgContent.documentMessage.mimetype;
              }

              if (mediaUrl) {
                console.log('✅ Found media URL, attempting to download and upload...');
                
                // Download and upload to Supabase Storage
                storageUrl = await downloadAndUploadMedia(
                  supabase,
                  {
                    type: mediaType,
                    url: mediaUrl,
                    mimeType
                  },
                  foundMessage,
                  msg.conversation_id,
                  instanceName
                );

                if (storageUrl) {
                  recovered = true;
                }
              }
            }
          } else {
            console.log(`⚠️ Evolution API returned ${mediaResponse.status}`);
          }
        } catch (apiError) {
          console.error('❌ Evolution API error:', apiError);
        }
      }

      // Update the message metadata
      if (!dryRun) {
        const currentMetadata = msg.metadata || {};
        let updatedMetadata: Record<string, any>;

        if (recovered && storageUrl) {
          // Media was recovered successfully
          updatedMetadata = {
            ...currentMetadata,
            attachment: {
              type: mediaType,
              url: storageUrl,
              mimeType: getMimeType(mediaType),
            },
            mediaRecovered: true,
            mediaRecoveredAt: new Date().toISOString()
          };
          
          result.repaired++;
          result.details.push({
            id: msg.id,
            status: 'repaired',
            message: `Mídia ${mediaType} recuperada com sucesso`
          });
          console.log(`✅ Message ${msg.id}: Media RECOVERED`);
        } else {
          // Mark as unavailable but don't lose existing metadata
          updatedMetadata = {
            ...currentMetadata,
            mediaUnavailable: true,
            mediaType: mediaType,
            mediaUnavailableReason: 'Mídia expirada no WhatsApp - não foi possível recuperar',
            markedUnavailableAt: new Date().toISOString()
          };
          
          result.markedUnavailable++;
          result.details.push({
            id: msg.id,
            status: 'unavailable',
            message: `Mídia ${mediaType} marcada como indisponível`
          });
          console.log(`⚠️ Message ${msg.id}: Marked as UNAVAILABLE`);
        }

        const { error: updateError } = await supabase
          .from('messages')
          .update({ metadata: updatedMetadata })
          .eq('id', msg.id);

        if (updateError) {
          console.error(`❌ Error updating message ${msg.id}:`, updateError);
          result.errors++;
          result.details.push({
            id: msg.id,
            status: 'error',
            message: `Erro ao atualizar: ${updateError.message}`
          });
        }
      } else {
        // Dry run - just report what would happen
        result.details.push({
          id: msg.id,
          status: 'unavailable',
          message: `[DRY RUN] Seria marcada como ${mediaType} indisponível`
        });
        result.markedUnavailable++;
      }
    }

    console.log('\n📊 REPAIR SUMMARY:');
    console.log(`   Total found: ${result.totalFound}`);
    console.log(`   Processed: ${result.processed}`);
    console.log(`   Repaired: ${result.repaired}`);
    console.log(`   Marked unavailable: ${result.markedUnavailable}`);
    console.log(`   Errors: ${result.errors}`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Fatal error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to get mime type
function getMimeType(mediaType: string): string {
  switch (mediaType) {
    case 'image': return 'image/jpeg';
    case 'audio': return 'audio/ogg';
    case 'video': return 'video/mp4';
    case 'document': return 'application/octet-stream';
    default: return 'application/octet-stream';
  }
}

// Helper function to get file extension
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'application/pdf': 'pdf',
  };
  return mimeToExt[mimeType] || 'bin';
}

// Download media and upload to Supabase Storage
async function downloadAndUploadMedia(
  supabase: any,
  attachment: { type: string; url: string; mimeType?: string },
  message: any,
  conversationId: string,
  instanceName: string
): Promise<string | null> {
  if (!attachment.url) return null;

  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.viainfra.chat';
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionKey) {
    console.error('❌ EVOLUTION_API_KEY not configured');
    return null;
  }

  try {
    console.log('📥 Downloading media from WhatsApp via Evolution API...');
    
    const mediaResponse = await fetch(`${evolutionUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        message: {
          key: message.key,
          message: message.message,
        },
        convertToMp4: false,
      }),
    });

    if (!mediaResponse.ok) {
      console.error('❌ Failed to download media:', mediaResponse.status);
      return null;
    }

    const mediaData = await mediaResponse.json();

    if (!mediaData.base64) {
      console.error('❌ No base64 data in response');
      return null;
    }

    console.log('✅ Media downloaded, uploading to Supabase Storage...');

    const base64Data = mediaData.base64.replace(/^data:[^;]+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const extension = getExtensionFromMimeType(attachment.mimeType || 'application/octet-stream');
    const fileName = `${conversationId}/${Date.now()}-recovered-${Math.random().toString(36).substring(7)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, binaryData, {
        contentType: attachment.mimeType || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Error uploading to storage:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);

    console.log('✅ Media uploaded to Supabase Storage:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;

  } catch (error) {
    console.error('❌ Error in downloadAndUploadMedia:', error);
    return null;
  }
}
