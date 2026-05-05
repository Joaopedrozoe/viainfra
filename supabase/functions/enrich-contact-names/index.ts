import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Enriquece nomes de contatos cujo `name` é puramente numérico
 * (telefone bruto). Tenta múltiplas estratégias na ordem:
 *   1. Última mensagem recebida com `metadata.sender_name` ou `pushName`
 *   2. Evolution: POST /chat/findContacts/{instance} com filtro por id
 *   3. Evolution: GET /chat/whatsappProfile/{instance}/{phone}
 *   4. Mantém telefone formatado caso não encontre nada
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { companyId, instanceName, limit = 100 } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    // Resolver instância: se informada usa, senão pega TODAS as conectadas
    let instances: { instance_name: string; company_id: string }[] = [];

    if (instanceName) {
      const { data } = await supabase
        .from('whatsapp_instances')
        .select('instance_name, company_id')
        .eq('instance_name', instanceName)
        .single();
      if (data) instances = [data];
    } else if (companyId) {
      const { data } = await supabase
        .from('whatsapp_instances')
        .select('instance_name, company_id')
        .eq('company_id', companyId)
        .eq('status', 'open');
      instances = data || [];
    } else {
      const { data } = await supabase
        .from('whatsapp_instances')
        .select('instance_name, company_id')
        .eq('status', 'open');
      instances = data || [];
    }

    if (instances.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No instances found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: Record<string, { fixed: number; checked: number }> = {};

    for (const inst of instances) {
      const stats = { fixed: 0, checked: 0 };
      results[inst.instance_name] = stats;

      // Pegar contatos com nome puramente numérico (telefone)
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, phone, metadata')
        .eq('company_id', inst.company_id)
        .not('phone', 'is', null)
        .limit(limit);

      const numericContacts = (contacts || []).filter(
        c => c.name && c.phone && /^\+?\d[\d\s\-()]+$/.test(c.name) && c.name.replace(/\D/g, '') === c.phone.replace(/\D/g, '')
      );

      console.log(`[enrich] ${inst.instance_name}: ${numericContacts.length} contatos com nome numérico`);

      // Pré-carregar mapa de pushName das últimas mensagens
      const pushNameMap = new Map<string, string>();
      try {
        const contactIds = numericContacts.map(c => c.id);
        if (contactIds.length > 0) {
          // Buscar conversas dos contatos
          const { data: convs } = await supabase
            .from('conversations')
            .select('id, contact_id')
            .in('contact_id', contactIds);
          
          const convToContact = new Map((convs || []).map(c => [c.id, c.contact_id]));
          const convIds = Array.from(convToContact.keys());
          
          if (convIds.length > 0) {
            // Última mensagem de user com sender_name por conversa
            const { data: msgs } = await supabase
              .from('messages')
              .select('conversation_id, metadata')
              .in('conversation_id', convIds)
              .eq('sender_type', 'user')
              .order('created_at', { ascending: false })
              .limit(500);
            
            for (const m of msgs || []) {
              const meta = m.metadata as any;
              const senderName = meta?.sender_name || meta?.pushName;
              const contactId = convToContact.get(m.conversation_id);
              if (contactId && senderName && !/^\+?\d[\d\s\-()]+$/.test(senderName) && !pushNameMap.has(contactId)) {
                pushNameMap.set(contactId, senderName);
              }
            }
          }
        }
      } catch (e) {
        console.error('[enrich] Erro ao buscar pushNames das mensagens:', e);
      }

      for (const contact of numericContacts) {
        stats.checked++;
        let resolvedName: string | null = null;
        const phone = contact.phone!;

        // ESTRATÉGIA 1: pushName das últimas mensagens
        const fromMessages = pushNameMap.get(contact.id);
        if (fromMessages) {
          resolvedName = fromMessages;
          console.log(`[enrich] ${phone} → "${resolvedName}" (de mensagens)`);
        }

        // ESTRATÉGIA 2: findContacts com filtro por id
        if (!resolvedName && evolutionUrl && evolutionKey) {
          try {
            const jid = `${phone}@s.whatsapp.net`;
            const r = await fetch(`${evolutionUrl}/chat/findContacts/${inst.instance_name}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
              body: JSON.stringify({ where: { id: jid } }),
            });
            if (r.ok) {
              const data = await r.json();
              const arr = Array.isArray(data) ? data : [data];
              for (const c of arr) {
                const n = c?.pushName || c?.name || c?.verifiedName;
                if (n && !/^\+?\d[\d\s\-()]+$/.test(n)) {
                  resolvedName = n;
                  console.log(`[enrich] ${phone} → "${resolvedName}" (findContacts)`);
                  break;
                }
              }
            }
          } catch (e) {
            console.error(`[enrich] findContacts erro ${phone}:`, e);
          }
        }

        // ESTRATÉGIA 3: whatsappProfile (perfil público)
        if (!resolvedName && evolutionUrl && evolutionKey) {
          try {
            const r = await fetch(
              `${evolutionUrl}/chat/fetchProfile/${inst.instance_name}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
                body: JSON.stringify({ number: phone }),
              }
            );
            if (r.ok) {
              const data = await r.json();
              const n = data?.name || data?.pushName || data?.wuid?.name;
              if (n && !/^\+?\d[\d\s\-()]+$/.test(n)) {
                resolvedName = n;
                console.log(`[enrich] ${phone} → "${resolvedName}" (fetchProfile)`);
              }
            }
          } catch (e) {
            console.error(`[enrich] fetchProfile erro ${phone}:`, e);
          }
        }

        if (resolvedName) {
          const { error } = await supabase
            .from('contacts')
            .update({ 
              name: resolvedName,
              metadata: { ...(contact.metadata as any || {}), nameEnrichedAt: new Date().toISOString() },
              updated_at: new Date().toISOString(),
            })
            .eq('id', contact.id);
          if (!error) stats.fixed++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[enrich-contact-names] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
