import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function isAllowedInstance(name: string): boolean {
  const upper = (name || '').toUpperCase();
  return upper.includes('VIAINFRA') || upper.includes('VIALOGISTIC');
}

function instanceMatchesCompany(instanceName: string, companyName: string): boolean {
  const instance = (instanceName || '').toUpperCase();
  return /vialogistic/i.test(companyName)
    ? instance.includes('VIALOGISTIC')
    : /viainfra/i.test(companyName) && instance.includes('VIAINFRA') && !instance.includes('VIALOGISTIC');
}

function friendlyGroupError(status: number, raw: string): string {
  const lower = (raw || '').toLowerCase();
  if ([400, 403, 405, 501].includes(status) || lower.includes('not-acceptable')) {
    return 'Recurso de grupo não habilitado pela Meta para esta conta';
  }
  return raw ? raw.substring(0, 300) : 'Falha ao executar ação de grupo';
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validar JWT do usuário autenticado
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return jsonResponse({ ok: false, error: 'Não autenticado' }, 401);
    }
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    const authUserId = userData?.user?.id;
    if (userError || !authUserId) {
      return jsonResponse({ ok: false, error: 'Não autenticado' }, 401);
    }

    const body = await req.json();
    const { conversationId, companyId: bodyCompanyId, action, payload } = body || {};

    if (!action || !bodyCompanyId) {
      return jsonResponse({ ok: false, error: 'Parâmetros obrigatórios ausentes (companyId, action)' }, 400);
    }

    // Verificar que o usuário tem acesso à empresa informada
    const [{ data: profileRow }, { data: accessRow }] = await Promise.all([
      supabase.from('profiles').select('company_id').eq('user_id', authUserId).eq('company_id', bodyCompanyId).maybeSingle(),
      supabase.from('company_access').select('company_id').eq('user_id', authUserId).eq('company_id', bodyCompanyId).maybeSingle(),
    ]);

    if (!profileRow && !accessRow) {
      return jsonResponse({ ok: false, error: 'Usuário sem acesso a esta empresa' }, 403);
    }

    // Resolver conversa (se informada) e groupJid
    let conversation: any = null;
    let groupJid: string | undefined = payload?.groupJid;

    if (conversationId) {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('*, contacts(*), companies(name)')
        .eq('id', conversationId)
        .eq('company_id', bodyCompanyId)
        .maybeSingle();

      if (convError || !conv) {
        return jsonResponse({ ok: false, error: 'Conversa não encontrada para esta empresa' }, 404);
      }
      conversation = conv;
      groupJid = groupJid || conv.contacts?.metadata?.remoteJid || conv.metadata?.remoteJid;
    }

    if (['info', 'participants', 'updateSubject', 'updateDescription', 'updatePicture', 'updateParticipant', 'updateSetting', 'inviteCode', 'revokeInviteCode', 'leave'].includes(action) && !groupJid) {
      return jsonResponse({ ok: false, error: 'groupJid não encontrado para esta conversa' }, 400);
    }

    // Resolver empresa (nome) para validar instância
    let companyName = conversation?.companies?.name || '';
    if (!companyName) {
      const { data: companyRow } = await supabase.from('companies').select('name').eq('id', bodyCompanyId).maybeSingle();
      companyName = companyRow?.name || '';
    }

    // Resolver instância Evolution ESTRITAMENTE da empresa (sem fallback cross-company)
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, company_id, status')
      .eq('company_id', bodyCompanyId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (instanceError || !instance || instance.company_id !== bodyCompanyId || !isAllowedInstance(instance.instance_name) || !instanceMatchesCompany(instance.instance_name, companyName)) {
      return jsonResponse({ ok: false, error: 'Nenhuma instância WhatsApp conectada para esta empresa' }, 400);
    }

    const instanceName = instance.instance_name;
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    const callEvolution = async (method: string, path: string, body?: unknown) => {
      const resp = await fetch(`${evolutionUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const text = await resp.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      return { ok: resp.ok, status: resp.status, data, raw: text };
    };

    const qGroup = groupJid ? `?groupJid=${encodeURIComponent(groupJid)}` : '';

    // Upsert de contato + conversa de grupo (mesmo shape usado pelo webhook)
    const upsertGroupConversation = async (jid: string, subject: string, participantsCount?: number) => {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', bodyCompanyId)
        .contains('metadata', { remoteJid: jid })
        .limit(1)
        .maybeSingle();

      let contact = existingContact;
      const metadata: Record<string, unknown> = {
        remoteJid: jid,
        isGroup: true,
        groupType: 'whatsapp',
        ...(participantsCount !== undefined ? { participantsCount } : {}),
      };

      if (contact) {
        const { data: updated } = await supabase
          .from('contacts')
          .update({ name: subject || contact.name, metadata: { ...(contact.metadata as object), ...metadata } })
          .eq('id', contact.id)
          .select()
          .single();
        contact = updated || contact;
      } else {
        const { data: created, error: createError } = await supabase
          .from('contacts')
          .insert({ name: subject || 'Grupo', company_id: bodyCompanyId, metadata })
          .select()
          .single();
        if (createError) throw createError;
        contact = created;
      }

      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('company_id', bodyCompanyId)
        .eq('contact_id', contact.id)
        .eq('channel', 'whatsapp')
        .limit(1)
        .maybeSingle();

      let conv = existingConv;
      if (!conv) {
        const { data: created, error: convCreateError } = await supabase
          .from('conversations')
          .insert({
            contact_id: contact.id,
            company_id: bodyCompanyId,
            channel: 'whatsapp',
            status: 'open',
            bot_active: false,
            metadata: { remoteJid: jid, isGroup: true, instanceName },
          })
          .select()
          .single();
        if (convCreateError) throw convCreateError;
        conv = created;
      }

      return { contact, conversation: conv };
    };

    let result: any = null;

    switch (action) {
      case 'info': {
        result = await callEvolution('GET', `/group/findGroupInfos/${instanceName}${qGroup}`);
        break;
      }
      case 'participants': {
        result = await callEvolution('GET', `/group/participants/${instanceName}${qGroup}`);
        break;
      }
      case 'create': {
        const { subject, description, participants } = payload || {};
        if (!subject || !Array.isArray(participants) || participants.length === 0) {
          return jsonResponse({ ok: false, error: 'Informe nome do grupo e ao menos um participante' }, 400);
        }
        result = await callEvolution('POST', `/group/create/${instanceName}`, { subject, description, participants });
        if (result.ok) {
          const createdJid = result.data?.id || result.data?.groupJid || result.data?.gid;
          if (createdJid) {
            try {
              const upserted = await upsertGroupConversation(createdJid, subject, participants.length);
              result.data = { ...result.data, conversationId: upserted.conversation.id };
            } catch (e) {
              console.error('[whatsapp-group-action] Erro ao criar conversa do grupo:', e);
            }
          }
        }
        break;
      }
      case 'updateSubject': {
        const { subject } = payload || {};
        if (!subject) return jsonResponse({ ok: false, error: 'Informe o novo nome do grupo' }, 400);
        result = await callEvolution('POST', `/group/updateGroupSubject/${instanceName}${qGroup}`, { subject });
        break;
      }
      case 'updateDescription': {
        const { description } = payload || {};
        result = await callEvolution('POST', `/group/updateGroupDescription/${instanceName}${qGroup}`, { description: description ?? '' });
        break;
      }
      case 'updatePicture': {
        const { image } = payload || {};
        if (!image) return jsonResponse({ ok: false, error: 'Informe a URL/base64 da imagem' }, 400);
        result = await callEvolution('POST', `/group/updateGroupPicture/${instanceName}${qGroup}`, { image });
        break;
      }
      case 'updateParticipant': {
        const { action: partAction, participants } = payload || {};
        if (!partAction || !Array.isArray(participants) || participants.length === 0) {
          return jsonResponse({ ok: false, error: 'Informe a ação e os participantes' }, 400);
        }
        result = await callEvolution('POST', `/group/updateParticipant/${instanceName}${qGroup}`, { action: partAction, participants });
        break;
      }
      case 'updateSetting': {
        const { action: settingAction } = payload || {};
        if (!settingAction) return jsonResponse({ ok: false, error: 'Informe a configuração desejada' }, 400);
        result = await callEvolution('POST', `/group/updateSetting/${instanceName}${qGroup}`, { action: settingAction });
        break;
      }
      case 'inviteCode': {
        result = await callEvolution('GET', `/group/inviteCode/${instanceName}${qGroup}`);
        break;
      }
      case 'revokeInviteCode': {
        result = await callEvolution('POST', `/group/revokeInviteCode/${instanceName}${qGroup}`);
        break;
      }
      case 'leave': {
        result = await callEvolution('DELETE', `/group/leaveGroup/${instanceName}${qGroup}`);
        break;
      }
      case 'list': {
        result = await callEvolution('GET', `/group/fetchAllGroups/${instanceName}?getParticipants=false`);
        if (result.ok) {
          const groups: any[] = Array.isArray(result.data) ? result.data : (result.data?.groups || []);
          const upsertedIds: string[] = [];
          for (const g of groups) {
            const jid = g?.id || g?.jid || g?.groupJid;
            if (!jid) continue;
            try {
              const upserted = await upsertGroupConversation(jid, g?.subject || g?.name || 'Grupo', g?.size || g?.participants?.length);
              upsertedIds.push(upserted.conversation.id);
            } catch (e) {
              console.error('[whatsapp-group-action] Erro ao sincronizar grupo:', jid, e);
            }
          }
          result.data = { groups, syncedConversationIds: upsertedIds };
        }
        break;
      }
      default:
        return jsonResponse({ ok: false, error: `Ação não suportada: ${action}` }, 400);
    }

    if (!result.ok) {
      const errorMessage = friendlyGroupError(result.status, typeof result.data === 'string' ? result.data : JSON.stringify(result.data || {}));
      return jsonResponse({ ok: false, error: errorMessage }, result.status && result.status < 500 ? result.status : 502);
    }

    return jsonResponse({ ok: true, data: result.data });
  } catch (error) {
    console.error('[whatsapp-group-action] Erro inesperado:', error);
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : 'Erro inesperado' }, 500);
  }
});
