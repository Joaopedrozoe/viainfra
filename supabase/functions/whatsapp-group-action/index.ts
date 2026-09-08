import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GRAPH = 'https://graph.facebook.com/v21.0';

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Credenciais oficiais da Meta por empresa (sem fallback cruzado). */
function resolveMetaCreds(companyName: string) {
  if (/vialogistic/i.test(companyName || '')) {
    return {
      key: 'VIALOGISTIC',
      token: Deno.env.get('META_ACCESS_TOKEN_VIALOGISTIC') || '',
      phoneNumberId: Deno.env.get('META_PHONE_NUMBER_ID_VIALOGISTIC') || '1157997970738498',
    };
  }
  return {
    key: 'VIAINFRA',
    token: Deno.env.get('META_ACCESS_TOKEN_VIAINFRA') || '',
    phoneNumberId: Deno.env.get('META_PHONE_NUMBER_ID_VIAINFRA') || '1221458467717278',
  };
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

    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return jsonResponse({ ok: false, error: 'Não autenticado' }, 401);
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    const authUserId = userData?.user?.id;
    if (userError || !authUserId) return jsonResponse({ ok: false, error: 'Não autenticado' }, 401);

    const body = await req.json();
    const { conversationId, companyId: bodyCompanyId, action, payload } = body || {};
    if (!action || !bodyCompanyId) {
      return jsonResponse({ ok: false, error: 'Parâmetros obrigatórios ausentes (companyId, action)' }, 400);
    }

    const [{ data: profileRow }, { data: accessRow }] = await Promise.all([
      supabase.from('profiles').select('company_id').eq('user_id', authUserId).eq('company_id', bodyCompanyId).maybeSingle(),
      supabase.from('company_access').select('company_id').eq('user_id', authUserId).eq('company_id', bodyCompanyId).maybeSingle(),
    ]);
    if (!profileRow && !accessRow) {
      return jsonResponse({ ok: false, error: 'Usuário sem acesso a esta empresa' }, 403);
    }

    // Conversa/grupo (quando informado)
    let conversation: any = null;
    let groupId: string | undefined = payload?.groupJid || payload?.groupId;

    if (conversationId) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('*, contacts(*), companies(name)')
        .eq('id', conversationId)
        .eq('company_id', bodyCompanyId)
        .maybeSingle();
      if (!conv) return jsonResponse({ ok: false, error: 'Conversa não encontrada para esta empresa' }, 404);
      conversation = conv;
      groupId = groupId || conv.contacts?.metadata?.groupId || conv.contacts?.metadata?.remoteJid || conv.metadata?.groupId || conv.metadata?.remoteJid;
    }

    let companyName = conversation?.companies?.name || '';
    if (!companyName) {
      const { data: companyRow } = await supabase.from('companies').select('name').eq('id', bodyCompanyId).maybeSingle();
      companyName = companyRow?.name || '';
    }

    const creds = resolveMetaCreds(companyName);
    if (!creds.token) {
      return jsonResponse({ ok: false, error: `META_ACCESS_TOKEN_${creds.key} não configurado` }, 400);
    }

    const needsGroup = ['info', 'participants', 'updateSubject', 'updateDescription', 'updatePicture', 'inviteCode', 'revokeInviteCode', 'leave'].includes(action);
    if (needsGroup && !groupId) {
      return jsonResponse({ ok: false, error: 'Grupo ainda não identificado nesta conversa' }, 400);
    }

    const callMeta = async (method: string, path: string, reqBody?: unknown) => {
      const resp = await fetch(`${GRAPH}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${creds.token}`,
          'Content-Type': 'application/json',
        },
        body: reqBody !== undefined ? JSON.stringify(reqBody) : undefined,
      });
      const text = await resp.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      return { ok: resp.ok, status: resp.status, data, raw: text };
    };

    const metaError = (result: any) => {
      const err = result?.data?.error;
      const msg = err?.error_user_msg || err?.message || (typeof result?.data === 'string' ? result.data : '') || 'Falha na API oficial da Meta';
      return `Meta (${result?.status}): ${String(msg).substring(0, 300)}`;
    };

    /** Cria/atualiza contato + conversa do grupo (mesmo shape do webhook). */
    const upsertGroupConversation = async (
      gid: string,
      subject: string,
      extra: Record<string, unknown> = {},
    ) => {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', bodyCompanyId)
        .contains('metadata', { groupId: gid })
        .limit(1)
        .maybeSingle();

      const metadata: Record<string, unknown> = {
        groupId: gid,
        remoteJid: gid,
        isGroup: true,
        groupType: 'whatsapp',
        api: 'meta-official',
        ...extra,
      };

      let contact = existingContact;
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
        const { data: created, error: convError } = await supabase
          .from('conversations')
          .insert({
            contact_id: contact.id,
            company_id: bodyCompanyId,
            channel: 'whatsapp',
            status: 'open',
            bot_active: false,
            metadata: { ...metadata, phoneNumberId: creds.phoneNumberId },
          })
          .select()
          .single();
        if (convError) throw convError;
        conv = created;
      } else {
        await supabase
          .from('conversations')
          .update({ metadata: { ...(conv.metadata as object), ...metadata, phoneNumberId: creds.phoneNumberId } })
          .eq('id', conv.id);
      }

      return { contact, conversation: conv };
    };

    let result: any = null;

    switch (action) {
      case 'create': {
        const { subject, description } = payload || {};
        if (!subject) return jsonResponse({ ok: false, error: 'Informe o nome do grupo' }, 400);

        result = await callMeta('POST', `/${creds.phoneNumberId}/groups`, {
          messaging_product: 'whatsapp',
          subject,
          ...(description ? { description } : {}),
        });
        if (!result.ok) return jsonResponse({ ok: false, error: metaError(result) }, 400);

        const gid = result.data?.id || result.data?.group_id || result.data?.groups?.[0]?.id;
        const inviteLink = result.data?.invite_link || result.data?.group_invite_link || result.data?.groups?.[0]?.invite_link || null;

        let conversationIdOut: string | undefined;
        if (gid) {
          try {
            const upserted = await upsertGroupConversation(gid, subject, {
              inviteLink,
              description: description || null,
              participantsCount: 0,
            });
            conversationIdOut = upserted.conversation.id;
          } catch (e) {
            console.error('[whatsapp-group-action] erro ao gravar conversa do grupo:', e);
          }
        }

        return jsonResponse({
          ok: true,
          data: {
            ...result.data,
            groupId: gid,
            inviteLink,
            conversationId: conversationIdOut,
            note: 'Na API oficial da Meta, participantes entram pelo link de convite — envie o link aos contatos.',
          },
        });
      }

      case 'list': {
        result = await callMeta('GET', `/${creds.phoneNumberId}/groups?limit=100`);
        if (!result.ok) return jsonResponse({ ok: false, error: metaError(result) }, 400);
        const groups: any[] = Array.isArray(result.data?.data) ? result.data.data : (result.data?.groups || []);
        const syncedConversationIds: string[] = [];
        for (const g of groups) {
          const gid = g?.id || g?.group_id;
          if (!gid) continue;
          try {
            const upserted = await upsertGroupConversation(gid, g?.subject || g?.name || 'Grupo', {
              inviteLink: g?.invite_link || null,
              description: g?.description || null,
              participantsCount: g?.participant_count ?? g?.participants?.length,
            });
            syncedConversationIds.push(upserted.conversation.id);
          } catch (e) {
            console.error('[whatsapp-group-action] erro ao sincronizar grupo:', gid, e);
          }
        }
        return jsonResponse({ ok: true, data: { groups, syncedConversationIds } });
      }

      case 'info': {
        result = await callMeta('GET', `/${groupId}?fields=id,subject,description,invite_link,participant_count,status`);
        break;
      }

      case 'participants': {
        result = await callMeta('GET', `/${groupId}/participants?limit=200`);
        break;
      }

      case 'updateSubject': {
        const { subject } = payload || {};
        if (!subject) return jsonResponse({ ok: false, error: 'Informe o novo nome do grupo' }, 400);
        result = await callMeta('POST', `/${groupId}`, { messaging_product: 'whatsapp', subject });
        if (result.ok) {
          try { await upsertGroupConversation(groupId!, subject); } catch { /* ignore */ }
        }
        break;
      }

      case 'updateDescription': {
        const { description } = payload || {};
        result = await callMeta('POST', `/${groupId}`, { messaging_product: 'whatsapp', description: description ?? '' });
        break;
      }

      case 'updatePicture': {
        const { image } = payload || {};
        if (!image) return jsonResponse({ ok: false, error: 'Informe a imagem do grupo' }, 400);
        result = await callMeta('POST', `/${groupId}`, { messaging_product: 'whatsapp', profile_picture_url: image });
        break;
      }

      case 'inviteCode': {
        result = await callMeta('GET', `/${groupId}?fields=invite_link`);
        break;
      }

      case 'revokeInviteCode': {
        result = await callMeta('POST', `/${groupId}/invite_link_revocations`, { messaging_product: 'whatsapp' });
        break;
      }

      case 'leave': {
        result = await callMeta('DELETE', `/${groupId}`);
        break;
      }

      case 'updateParticipant': {
        // A API oficial da Meta não permite adicionar/remover participantes à força.
        const { action: partAction, participants } = payload || {};
        if (partAction === 'remove' && Array.isArray(participants) && participants.length > 0) {
          const removals: any[] = [];
          for (const p of participants) {
            const phone = String(p).replace(/\D/g, '');
            const r = await callMeta('DELETE', `/${groupId}/participants?participant=${encodeURIComponent(phone)}`);
            removals.push({ phone, ok: r.ok, error: r.ok ? null : metaError(r) });
          }
          const failed = removals.filter((r) => !r.ok);
          if (failed.length === removals.length) {
            return jsonResponse({ ok: false, error: failed[0].error }, 400);
          }
          return jsonResponse({ ok: true, data: { removals } });
        }
        return jsonResponse({
          ok: false,
          error: 'A API oficial da Meta não permite adicionar participantes. Compartilhe o link de convite do grupo para que entrem por opt-in.',
        }, 400);
      }

      case 'updateSetting': {
        const { action: settingAction } = payload || {};
        if (!settingAction) return jsonResponse({ ok: false, error: 'Informe a configuração desejada' }, 400);
        const map: Record<string, Record<string, unknown>> = {
          announcement: { messaging_permission: 'admins' },
          not_announcement: { messaging_permission: 'all' },
          locked: { edit_permission: 'admins' },
          unlocked: { edit_permission: 'all' },
        };
        const patch = map[String(settingAction)];
        if (!patch) return jsonResponse({ ok: false, error: 'Configuração não suportada pela API oficial' }, 400);
        result = await callMeta('POST', `/${groupId}`, { messaging_product: 'whatsapp', ...patch });
        break;
      }

      default:
        return jsonResponse({ ok: false, error: `Ação não suportada: ${action}` }, 400);
    }

    if (!result.ok) {
      return jsonResponse({ ok: false, error: metaError(result) }, result.status && result.status < 500 ? result.status : 502);
    }

    return jsonResponse({ ok: true, data: result.data });
  } catch (error) {
    console.error('[whatsapp-group-action] Erro inesperado:', error);
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : 'Erro inesperado' }, 500);
  }
});
