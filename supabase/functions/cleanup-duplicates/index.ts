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

    console.log('🧹 Cleaning duplicate messages...');

    // Find all duplicates
    const { data: duplicates, error: queryError } = await supabase
      .rpc('find_duplicate_messages');

    if (queryError) {
      // If RPC doesn't exist, use raw approach
      console.log('Using manual approach...');
      
      // Get all messages
      const { data: allMessages } = await supabase
        .from('messages')
        .select('id, conversation_id, content, sender_type, created_at')
        .order('created_at', { ascending: true });

      if (!allMessages) {
        return new Response(JSON.stringify({ error: 'No messages found' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Group by conversation + content + sender_type + created_at
      const groups = new Map<string, string[]>();
      
      for (const msg of allMessages) {
        const key = `${msg.conversation_id}|${msg.content}|${msg.sender_type}|${msg.created_at}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(msg.id);
      }

      // Find groups with more than one message (duplicates)
      const idsToDelete: string[] = [];
      
      for (const [key, ids] of groups.entries()) {
        if (ids.length > 1) {
          // Keep the first one, delete the rest
          idsToDelete.push(...ids.slice(1));
        }
      }

      console.log(`Found ${idsToDelete.length} duplicate messages to delete`);

      if (idsToDelete.length > 0) {
        // Delete in batches
        const batchSize = 100;
        let deleted = 0;
        
        for (let i = 0; i < idsToDelete.length; i += batchSize) {
          const batch = idsToDelete.slice(i, i + batchSize);
          const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .in('id', batch);

          if (deleteError) {
            console.error('Delete error:', deleteError);
          } else {
            deleted += batch.length;
          }
        }

        console.log(`✅ Deleted ${deleted} duplicate messages`);

        return new Response(JSON.stringify({
          success: true,
          duplicatesFound: idsToDelete.length,
          deleted: deleted
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        duplicatesFound: 0,
        message: 'No duplicates found'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
