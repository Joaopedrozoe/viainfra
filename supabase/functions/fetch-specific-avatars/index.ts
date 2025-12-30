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

  console.log('🔄 Fetching specific avatars...');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.viainfra.chat';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionKey) {
      return new Response(JSON.stringify({ error: 'EVOLUTION_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const instanceName = 'VIAINFRAOFICIAL';
    const results: any[] = [];

    // Contatos específicos para atualizar
    const targets = [
      { 
        id: '50ca181f-4ca0-413c-84da-280275f960b2', 
        name: 'VIAINFRA-O.M MANUTENÇÃO',
        remoteJid: '120363419406852083@g.us',
        isGroup: true
      },
      { 
        id: 'dc555fea-79ca-4fb9-94c5-483e1b1e9ee3', 
        name: 'Flávia Financeiro',
        remoteJid: '5511971947986@s.whatsapp.net',
        isGroup: false
      }
    ];

    for (const target of targets) {
      console.log(`\n📸 Processing: ${target.name}`);
      
      let pictureUrl: string | null = null;

      if (target.isGroup) {
        // Para grupos, usar fetchGroupMetadata
        console.log(`🔍 Fetching group metadata for ${target.remoteJid}...`);
        
        try {
          const groupUrl = `${evolutionUrl}/group/fetchGroupMetadata/${instanceName}?groupJid=${target.remoteJid}`;
          console.log(`📡 Group URL: ${groupUrl}`);
          
          const groupResponse = await fetch(groupUrl, {
            method: 'GET',
            headers: {
              'apikey': evolutionKey,
              'Content-Type': 'application/json',
            },
          });
          
          console.log(`📡 Group response status: ${groupResponse.status}`);
          const groupData = await groupResponse.json();
          console.log(`📡 Group data:`, JSON.stringify(groupData).substring(0, 500));
          
          if (groupData?.pictureUrl) {
            pictureUrl = groupData.pictureUrl;
            console.log(`✅ Found group picture: ${pictureUrl.substring(0, 100)}...`);
          } else if (groupData?.profilePictureUrl) {
            pictureUrl = groupData.profilePictureUrl;
            console.log(`✅ Found group profilePictureUrl: ${pictureUrl.substring(0, 100)}...`);
          }
        } catch (err) {
          console.error(`❌ Error fetching group:`, err);
        }

        // Fallback: tentar via fetchProfilePictureUrl
        if (!pictureUrl) {
          console.log(`🔄 Trying fetchProfilePictureUrl for group...`);
          try {
            const picUrl = `${evolutionUrl}/chat/fetchProfilePictureUrl/${instanceName}`;
            const picResponse = await fetch(picUrl, {
              method: 'POST',
              headers: {
                'apikey': evolutionKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ number: target.remoteJid }),
            });
            
            console.log(`📡 Picture response status: ${picResponse.status}`);
            const picData = await picResponse.json();
            console.log(`📡 Picture data:`, JSON.stringify(picData).substring(0, 500));
            
            if (picData?.profilePictureUrl) {
              pictureUrl = picData.profilePictureUrl;
            } else if (picData?.picture) {
              pictureUrl = picData.picture;
            } else if (picData?.url) {
              pictureUrl = picData.url;
            }
          } catch (err) {
            console.error(`❌ Error fetching picture URL:`, err);
          }
        }
      } else {
        // Para contatos individuais
        console.log(`🔍 Fetching profile picture for ${target.remoteJid}...`);
        
        try {
          const picUrl = `${evolutionUrl}/chat/fetchProfilePictureUrl/${instanceName}`;
          const picResponse = await fetch(picUrl, {
            method: 'POST',
            headers: {
              'apikey': evolutionKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ number: target.remoteJid }),
          });
          
          console.log(`📡 Picture response status: ${picResponse.status}`);
          const picData = await picResponse.json();
          console.log(`📡 Picture data:`, JSON.stringify(picData));
          
          if (picData?.profilePictureUrl) {
            pictureUrl = picData.profilePictureUrl;
          } else if (picData?.picture) {
            pictureUrl = picData.picture;
          } else if (picData?.url) {
            pictureUrl = picData.url;
          }
        } catch (err) {
          console.error(`❌ Error:`, err);
        }
      }

      // Se encontrou URL, fazer download e upload para storage
      if (pictureUrl) {
        console.log(`📥 Downloading image...`);
        
        try {
          const imgResponse = await fetch(pictureUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
          
          if (imgResponse.ok) {
            const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
            const arrayBuffer = await imgResponse.arrayBuffer();
            const blob = new Uint8Array(arrayBuffer);
            
            let extension = 'jpg';
            if (contentType.includes('png')) extension = 'png';
            else if (contentType.includes('webp')) extension = 'webp';
            
            const fileName = `${target.id}.${extension}`;
            
            // Upload para storage
            const { error: uploadError } = await supabase.storage
              .from('profile-pictures')
              .upload(fileName, blob, {
                contentType,
                upsert: true,
              });
            
            if (uploadError) {
              console.error(`❌ Upload error:`, uploadError.message);
              results.push({ id: target.id, name: target.name, status: 'upload_error', error: uploadError.message });
            } else {
              // Get public URL
              const { data: urlData } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(fileName);
              
              const publicUrl = urlData.publicUrl + '?v=' + Date.now();
              
              // Update contact
              const { error: updateError } = await supabase
                .from('contacts')
                .update({ 
                  avatar_url: publicUrl,
                  updated_at: new Date().toISOString()
                })
                .eq('id', target.id);
              
              if (updateError) {
                console.error(`❌ Update error:`, updateError.message);
                results.push({ id: target.id, name: target.name, status: 'update_error', error: updateError.message });
              } else {
                console.log(`✅ Updated avatar for ${target.name}`);
                results.push({ id: target.id, name: target.name, status: 'success', avatarUrl: publicUrl });
              }
            }
          } else {
            console.log(`❌ Failed to download image: ${imgResponse.status}`);
            results.push({ id: target.id, name: target.name, status: 'download_error', httpStatus: imgResponse.status });
          }
        } catch (err) {
          console.error(`❌ Download error:`, err);
          results.push({ id: target.id, name: target.name, status: 'error', error: String(err) });
        }
      } else {
        console.log(`❌ No picture URL found for ${target.name}`);
        results.push({ id: target.id, name: target.name, status: 'no_picture_found' });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(JSON.stringify({ 
      error: String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
