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

  console.log('🧹 CLEANUP GROUP DUPLICATES - Starting...');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { dryRun = false, companyId } = await req.json().catch(() => ({}));

    const stats = {
      totalGroups: 0,
      duplicatesFound: 0,
      contactsDeleted: 0,
      conversationsMoved: 0,
      orphanConversationsCreated: 0,
      errors: [] as string[]
    };

    // Build query
    let query = supabase
      .from('contacts')
      .select('id, name, phone, company_id, metadata, created_at')
      .contains('metadata', { isGroup: true });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data: groupContacts, error: fetchError } = await query.order('created_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch groups: ${fetchError.message}`);
    }

    console.log(`📊 Found ${groupContacts?.length || 0} group contacts`);
    stats.totalGroups = groupContacts?.length || 0;

    // Group by remoteJid
    const groupsByJid = new Map<string, any[]>();
    
    for (const contact of groupContacts || []) {
      const remoteJid = contact.metadata?.remoteJid;
      if (!remoteJid) continue;
      
      if (!groupsByJid.has(remoteJid)) {
        groupsByJid.set(remoteJid, []);
      }
      groupsByJid.get(remoteJid)!.push(contact);
    }

    console.log(`📊 Unique groups by JID: ${groupsByJid.size}`);

    // Process each group of duplicates
    for (const [remoteJid, contacts] of groupsByJid.entries()) {
      if (contacts.length <= 1) continue;

      console.log(`\n🔍 Processing duplicates for: ${remoteJid}`);
      console.log(`   Found ${contacts.length} duplicate contacts`);
      stats.duplicatesFound += contacts.length - 1;

      // Sort: prefer one with conversation, then oldest
      const { data: conversationsForGroup } = await supabase
        .from('conversations')
        .select('id, contact_id')
        .in('contact_id', contacts.map(c => c.id));

      const contactsWithConv = new Set(conversationsForGroup?.map(c => c.contact_id) || []);

      // Sort contacts: those with conversations first, then by created_at
      contacts.sort((a, b) => {
        const aHasConv = contactsWithConv.has(a.id) ? 0 : 1;
        const bHasConv = contactsWithConv.has(b.id) ? 0 : 1;
        if (aHasConv !== bHasConv) return aHasConv - bHasConv;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const primaryContact = contacts[0];
      const duplicates = contacts.slice(1);

      console.log(`   ✅ Primary contact: ${primaryContact.id} (${primaryContact.name})`);
      console.log(`   🗑️ Duplicates to remove: ${duplicates.length}`);

      if (dryRun) {
        console.log(`   [DRY RUN] Would delete ${duplicates.length} duplicates`);
        continue;
      }

      // Move conversations from duplicates to primary contact
      for (const dup of duplicates) {
        const { data: dupeConvs } = await supabase
          .from('conversations')
          .select('id')
          .eq('contact_id', dup.id);

        if (dupeConvs && dupeConvs.length > 0) {
          console.log(`   📤 Moving ${dupeConvs.length} conversations from ${dup.id} to ${primaryContact.id}`);
          
          const { error: moveError } = await supabase
            .from('conversations')
            .update({ contact_id: primaryContact.id })
            .eq('contact_id', dup.id);

          if (moveError) {
            console.error(`   ❌ Error moving conversations:`, moveError);
            stats.errors.push(`Move conv error: ${moveError.message}`);
          } else {
            stats.conversationsMoved += dupeConvs.length;
          }
        }

        // Delete duplicate contact
        const { error: deleteError } = await supabase
          .from('contacts')
          .delete()
          .eq('id', dup.id);

        if (deleteError) {
          console.error(`   ❌ Error deleting duplicate:`, deleteError);
          stats.errors.push(`Delete error: ${deleteError.message}`);
        } else {
          stats.contactsDeleted++;
          console.log(`   ✅ Deleted duplicate: ${dup.id}`);
        }
      }
    }

    // STEP 2: Create conversations for orphan group contacts (no conversation)
    console.log('\n📋 STEP 2: Creating conversations for orphan groups...');
    
    const { data: orphanGroups } = await supabase
      .from('contacts')
      .select('id, name, company_id, metadata')
      .contains('metadata', { isGroup: true })
      .not('id', 'in', `(SELECT contact_id FROM conversations WHERE contact_id IS NOT NULL)`);

    // Fetch all contact IDs that have conversations
    const { data: contactsWithConversations } = await supabase
      .from('conversations')
      .select('contact_id')
      .not('contact_id', 'is', null);

    const contactIdsWithConv = new Set(contactsWithConversations?.map(c => c.contact_id) || []);

    // Get all group contacts again
    const { data: allGroupContacts } = await supabase
      .from('contacts')
      .select('id, name, company_id, metadata')
      .contains('metadata', { isGroup: true });

    const orphansToFix = (allGroupContacts || []).filter(c => !contactIdsWithConv.has(c.id));
    
    console.log(`📊 Found ${orphansToFix.length} orphan groups without conversations`);

    for (const orphan of orphansToFix) {
      if (dryRun) {
        console.log(`   [DRY RUN] Would create conversation for: ${orphan.name}`);
        continue;
      }

      const { error: createError } = await supabase
        .from('conversations')
        .insert({
          company_id: orphan.company_id,
          contact_id: orphan.id,
          channel: 'whatsapp',
          status: 'open',
          metadata: {
            isGroup: true,
            remoteJid: orphan.metadata?.remoteJid,
            createdByCleanup: true
          }
        });

      if (createError) {
        // Check if duplicate key error
        if (createError.code === '23505') {
          console.log(`   ⚠️ Conversation already exists for ${orphan.name}`);
        } else {
          console.error(`   ❌ Error creating conversation for ${orphan.name}:`, createError);
          stats.errors.push(`Create conv error: ${createError.message}`);
        }
      } else {
        stats.orphanConversationsCreated++;
        console.log(`   ✅ Created conversation for: ${orphan.name}`);
      }
    }

    console.log('\n✅ CLEANUP COMPLETE');
    console.log(`   Total groups: ${stats.totalGroups}`);
    console.log(`   Duplicates found: ${stats.duplicatesFound}`);
    console.log(`   Contacts deleted: ${stats.contactsDeleted}`);
    console.log(`   Conversations moved: ${stats.conversationsMoved}`);
    console.log(`   Orphan conversations created: ${stats.orphanConversationsCreated}`);
    console.log(`   Errors: ${stats.errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      stats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
