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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => ({}));
    const conversationId = body.conversationId || '6033f765-cb84-45ff-858c-ea51fc444529';

    console.log(`\n🧹 Cleaning duplicates for conversation: ${conversationId}`);

    // 1. Fix the manual message sender_type
    const { data: manualMsg, error: findError } = await supabase
      .from('messages')
      .select('id, content, sender_type')
      .eq('id', '70b4f79c-aecd-4496-b4bb-f9f221629e8f')
      .maybeSingle();

    if (manualMsg && manualMsg.sender_type === 'user') {
      console.log(`   Fixing sender_type for manual message: ${manualMsg.id}`);
      await supabase
        .from('messages')
        .update({ sender_type: 'agent' })
        .eq('id', manualMsg.id);
      console.log(`   ✅ Changed sender_type to 'agent'`);
    }

    // 2. Get all messages for this conversation
    const { data: allMessages } = await supabase
      .from('messages')
      .select('id, content, sender_type, created_at, metadata')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    console.log(`   Found ${allMessages?.length || 0} total messages`);

    // 3. Find duplicates by content + created_at + sender_type
    const seen = new Map<string, string>();
    const toDelete: string[] = [];

    for (const msg of allMessages || []) {
      const key = `${msg.content}|${msg.created_at}|${msg.sender_type}`;
      
      if (seen.has(key)) {
        // This is a duplicate, keep the one with more metadata
        const existingId = seen.get(key)!;
        const existingMsg = allMessages?.find(m => m.id === existingId);
        
        const existingMetaKeys = Object.keys(existingMsg?.metadata || {}).length;
        const currentMetaKeys = Object.keys(msg.metadata || {}).length;
        
        if (currentMetaKeys > existingMetaKeys) {
          // Current has more metadata, delete the existing
          toDelete.push(existingId);
          seen.set(key, msg.id);
          console.log(`   Duplicate found (keeping newer): \"${msg.content.slice(0, 30)}...\"`);
        } else {
          // Existing has more or equal metadata, delete current
          toDelete.push(msg.id);
          console.log(`   Duplicate found (keeping older): \"${msg.content.slice(0, 30)}...\"`);
        }
      } else {
        seen.set(key, msg.id);
      }
    }

    console.log(`\n   Found ${toDelete.length} duplicates to remove`);

    // 4. Delete duplicates
    if (toDelete.length > 0) {
      for (const id of toDelete) {
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.log(`   ❌ Failed to delete ${id}: ${error.message}`);
        } else {
          console.log(`   🗑️ Deleted: ${id}`);
        }
      }
    }

    // 5. Get final count
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    console.log(`\n✅ Cleanup complete. ${count} messages remaining.`);

    return new Response(JSON.stringify({
      success: true,
      duplicatesRemoved: toDelete.length,
      messagesRemaining: count,
      senderTypeFixed: manualMsg?.sender_type === 'user'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
