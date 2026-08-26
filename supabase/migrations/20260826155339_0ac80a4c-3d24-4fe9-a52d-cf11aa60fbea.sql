create or replace function public.bot_http_fetch(p_url text, p_method text default 'GET', p_body jsonb default null)
returns text
language plpgsql
security definer
set search_path = public
as $fn$
declare
  rid bigint;
  res text;
  i int := 0;
begin
  if upper(p_method) = 'GET' then
    select net.http_get(url => p_url, timeout_milliseconds => 15000) into rid;
  else
    select net.http_post(
      url => p_url,
      body => coalesce(p_body, '{}'::jsonb),
      headers => '{"Content-Type":"application/json"}'::jsonb,
      timeout_milliseconds => 15000
    ) into rid;
  end if;

  while i < 40 loop
    perform pg_sleep(0.5);
    i := i + 1;
    select content into res from net._http_response where id = rid;
    if found then
      return res;
    end if;
  end loop;
  return null;
exception when others then
  return null;
end
$fn$;

revoke all on function public.bot_http_fetch(text, text, jsonb) from public, anon, authenticated;

create or replace function public.web_bot_process(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  gs_url text := 'https://script.google.com/macros/s/AKfycbz0viYlAJ_-v00BzqRgMROE0wdvixohvQ4d949mTvRQk_eRdqN-CsxQeAldpV6HR2xlBQ/exec';
  v_action text := coalesce(payload->>'action', 'message');
  v_state jsonb := coalesce(payload->'state', 'null'::jsonb);
  v_msg text := nullif(btrim(coalesce(payload->>'userMessage', '')), '');
  v_company uuid := nullif(payload->>'companyId', '')::uuid;
  v_request text := nullif(payload->>'requestId', '');
  v_contact_info jsonb := coalesce(payload->'contactInfo', '{}'::jsonb);
  v_mode text;
  v_step text;
  v_conv uuid;
  v_contact uuid;
  v_token uuid;
  v_response text := '';
  v_options jsonb := '[]'::jsonb;
  v_existing record;
  v_conv_row record;
  v_msg_id uuid;
  v_input text;
  v_setor text;
  v_setor_key text;
  v_agent text;
  v_placas jsonb;
  v_placa text;
  v_idx int;
  v_raw text;
  v_json jsonb;
  v_numero text;
  v_chamado jsonb;
  v_ok boolean := false;
begin
  if v_state is null or v_state = 'null'::jsonb then
    v_state := jsonb_build_object('mode', 'menu');
  end if;

  if v_request is not null and v_request !~* '^[0-9a-f-]{36}$' then
    return jsonb_build_object('error', 'Invalid requestId');
  end if;

  v_mode := coalesce(v_state->>'mode', 'menu');
  v_step := v_state->>'chamadoStep';
  v_conv := nullif(v_state->>'conversationId', '')::uuid;
  v_contact := nullif(v_state->>'contactId', '')::uuid;
  v_token := nullif(v_state->>'accessToken', '')::uuid;

  if v_conv is null and v_company is not null then
    select * into v_existing
    from public.contacts
    where company_id = v_company
      and (
        (nullif(v_contact_info->>'phone','') is not null and phone = v_contact_info->>'phone')
        or (nullif(v_contact_info->>'email','') is not null and email = v_contact_info->>'email')
      )
    order by created_at desc
    limit 1;

    if found then
      v_contact := v_existing.id;
    else
      insert into public.contacts (company_id, name, phone, email)
      values (v_company, coalesce(nullif(v_contact_info->>'name',''), 'Cliente Web'),
              nullif(v_contact_info->>'phone',''), nullif(v_contact_info->>'email',''))
      returning id into v_contact;
    end if;

    select id, access_token into v_conv, v_token
    from public.conversations
    where contact_id = v_contact and channel = 'web' and status in ('open','pending')
    order by created_at desc
    limit 1;

    if v_conv is null then
      insert into public.conversations (company_id, contact_id, channel, status)
      values (v_company, v_contact, 'web', 'open')
      returning id, access_token into v_conv, v_token;
    else
      update public.conversations set updated_at = now() where id = v_conv;
    end if;

    v_state := v_state
      || jsonb_build_object('contactId', v_contact, 'conversationId', v_conv,
                            'companyId', v_company, 'accessToken', v_token);
  end if;

  if v_conv is not null then
    select bot_active, metadata into v_conv_row from public.conversations where id = v_conv;
    if found and (v_conv_row.bot_active is false or (v_conv_row.metadata->>'agent_takeover') = 'true') then
      if v_msg is not null then
        insert into public.messages (conversation_id, sender_type, content, metadata)
        values (v_conv, 'user', v_msg,
                case when v_request is null then '{}'::jsonb else jsonb_build_object('request_id', v_request || ':user') end)
        on conflict do nothing;
      end if;
      return jsonb_build_object(
        'message', '', 'options', null, 'silent', true,
        'state', v_state || jsonb_build_object('mode','atendente','waitingForAgent', true),
        'mode', 'atendente');
    end if;
  end if;

  if v_request is not null and v_conv is not null then
    select id, content, metadata into v_existing
    from public.messages
    where conversation_id = v_conv and sender_type = 'bot' and metadata->>'request_id' = v_request
    limit 1;
    if found then
      return jsonb_build_object(
        'message', v_existing.content,
        'messageId', v_existing.id,
        'state', coalesce(v_existing.metadata->'response_state', v_state),
        'options', v_existing.metadata->'options',
        'mode', coalesce(v_existing.metadata->'response_state'->>'mode', v_mode),
        'replayed', true);
    end if;
  end if;

  if v_msg is not null and v_conv is not null then
    if not exists (
      select 1 from public.messages
      where conversation_id = v_conv and sender_type = 'user' and content = v_msg
        and created_at >= now() - interval '2 seconds'
    ) then
      insert into public.messages (conversation_id, sender_type, content, metadata)
      values (v_conv, 'user', v_msg,
              case when v_request is null then '{}'::jsonb else jsonb_build_object('request_id', v_request || ':user') end)
      on conflict do nothing;
    end if;
  end if;

  v_input := lower(coalesce(v_msg, ''));

  if v_msg = '0' and v_mode <> 'menu' then
    v_state := (v_state - 'chamadoStep' - 'placas' - 'selectedSetor' - 'selectedAgent')
               || jsonb_build_object('mode','menu','waitingForAgent', false);
    v_mode := 'menu';
    v_response := E'\U0001F44B Voltando ao menu principal...\n\nComo posso ajudar você hoje?';
    v_options := jsonb_build_array('1️⃣ Abrir Chamado','2️⃣ Falar com Atendente','3️⃣ Consultar Chamado','4️⃣ FAQ / Dúvidas');

  elsif v_mode = 'menu' then
    v_options := jsonb_build_array('1️⃣ Abrir Chamado','2️⃣ Falar com Atendente','3️⃣ Consultar Chamado','4️⃣ FAQ / Dúvidas');
    if v_input = '1' or v_input like '%abrir%' or v_input like '%chamado%' then
      v_state := v_state || jsonb_build_object('mode','chamado','chamadoStep','nome');
      v_response := E'\U0001F3AB **Processo de Abertura de Chamado Iniciado**\n\n\U0001F464 Por favor, informe seu **nome completo**:';
      v_options := '[]'::jsonb;
    elsif v_input = '2' or v_input like '%atendente%' or v_input like '%falar%' then
      v_state := v_state || jsonb_build_object('mode','escolhendoSetor');
      v_response := E'\U0001F465 **Atendimento Humano**\n\nPor favor, escolha o setor que deseja ser atendido:';
      v_options := jsonb_build_array('📞 Atendimento','💼 Comercial','🔧 Manutenção','💰 Financeiro','👥 RH');
    elsif v_input = '3' or v_input like '%consultar%' then
      v_response := E'\U0001F50D **Consulta de Chamado**\n\nPor favor, informe o **número do chamado** que deseja consultar:';
      v_options := '[]'::jsonb;
    elsif v_input = '4' or v_input like '%faq%' or v_input like '%duvida%' or v_input like '%dúvida%' then
      v_response := E'❓ **Perguntas Frequentes**\n\n1. Como abrir um chamado?\n2. Quanto tempo demora o atendimento?\n3. Como acompanhar meu chamado?\n4. Horário de funcionamento\n\nDigite o número da pergunta ou volte ao menu principal digitando **0**.';
      v_options := '[]'::jsonb;
    elsif v_msg is null or v_action = 'start' then
      v_response := E'\U0001F44B Olá! Bem-vindo à **Viainfra**!\n\nComo posso ajudar você hoje?\n'
        || array_to_string(array(select jsonb_array_elements_text(v_options)), E'\n');
    else
      v_response := 'Desculpe, não entendi. Escolha uma das opções acima digitando o número correspondente.';
    end if;

  elsif v_mode = 'escolhendoSetor' then
    v_setor := case btrim(coalesce(v_msg,''))
      when '1' then 'Atendimento'
      when '2' then 'Comercial'
      when '3' then 'Manutenção'
      when '4' then 'Financeiro'
      when '5' then 'RH'
      else nullif(btrim(regexp_replace(coalesce(v_msg,''), '^[^[:alnum:]]+', '')), '')
    end;
    v_setor := coalesce(v_setor, 'Atendimento');
    v_setor_key := lower(regexp_replace(translate(v_setor,
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'), '[^a-zA-Z]', '', 'g'));
    v_agent := case v_setor_key
      when 'atendimento' then 'Joicy Souza'
      when 'comercial' then 'Elisabete Silva'
      when 'manutencao' then 'Suelem Souza'
      when 'financeiro' then 'André Rocha'
      when 'rh' then 'Sandra Romano'
      else null
    end;
    if v_agent is null then
      v_setor := 'Atendimento';
      v_agent := 'Joicy Souza';
    end if;

    v_state := v_state || jsonb_build_object('mode','atendente','waitingForAgent', true,
                                             'selectedSetor', v_setor, 'selectedAgent', v_agent);
    if v_conv is not null then
      update public.conversations
      set status = 'pending',
          metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('setor', v_setor, 'atendente', v_agent),
          updated_at = now()
      where id = v_conv;
    end if;
    v_response := 'Aguarde um momento, você será atendido por **' || v_agent || '** do setor ' || v_setor || '...';
    v_options := '[]'::jsonb;

  elsif v_mode = 'atendente' then
    v_response := '';
    v_options := '[]'::jsonb;

  elsif v_mode = 'chamado' then
    if v_step = 'nome' then
      if v_msg is null then
        v_response := '❌ Por favor, informe seu nome completo.';
      else
        v_state := v_state || jsonb_build_object('nomeCliente', v_msg, 'chamadoStep', 'telefone');
        v_response := '✅ Nome registrado: **' || v_msg || E'**\n\n\U0001F4F1 Agora, informe um **número de telefone** para contato:';
      end if;

    elsif v_step = 'telefone' then
      if v_msg is null then
        v_response := '❌ Por favor, informe um número de telefone válido.';
      else
        v_state := v_state || jsonb_build_object('telefoneCliente', v_msg);

        select id into v_existing from public.contacts
        where phone = v_msg and company_id = v_company limit 1;
        if found then
          update public.contacts
            set name = coalesce(v_state->>'nomeCliente', name),
                metadata = coalesce(metadata,'{}'::jsonb) || '{"source":"web_bot","updated":true}'::jsonb
          where id = v_existing.id;
          if v_conv is not null then
            update public.conversations set contact_id = v_existing.id, updated_at = now() where id = v_conv;
          end if;
          v_state := v_state || jsonb_build_object('contactId', v_existing.id);
        elsif v_contact is not null then
          update public.contacts
            set name = coalesce(v_state->>'nomeCliente', name), phone = v_msg,
                metadata = coalesce(metadata,'{}'::jsonb) || '{"source":"web_bot"}'::jsonb
          where id = v_contact;
        end if;

        v_raw := public.bot_http_fetch(gs_url || '?action=ultimoChamado');
        begin
          v_json := v_raw::jsonb;
        exception when others then v_json := null; end;
        v_numero := coalesce(v_json->>'numeroChamado', 'N/A');

        v_raw := public.bot_http_fetch(gs_url || '?action=placas');
        begin
          v_placas := coalesce((v_raw::jsonb)->'placas', '[]'::jsonb);
        exception when others then v_placas := '[]'::jsonb; end;

        v_state := v_state || jsonb_build_object('chamadoStep','inicio','numeroPrevisto', v_numero, 'placas', v_placas);
        v_response := '✅ Telefone registrado: **' || v_msg || E'**\n\n\U0001F3AB Número previsto: **' || v_numero || E'**\n\n\U0001F4CB Selecione uma placa:';
        v_options := '[]'::jsonb;
      end if;

    elsif v_step in ('inicio','placa') then
      if v_msg is null then
        v_response := '❌ Por favor, selecione uma placa da lista ou digite uma placa válida.';
      else
        v_placas := coalesce(v_state->'placas', '[]'::jsonb);
        v_placa := null;
        if v_msg ~ '^[0-9]+$' then
          v_idx := v_msg::int;
          if v_idx >= 1 and v_idx <= jsonb_array_length(v_placas) then
            v_placa := v_placas->>(v_idx - 1);
          end if;
        end if;
        v_placa := coalesce(v_placa, upper(v_msg));
        v_state := (v_state - 'placas') || jsonb_build_object('placa', v_placa, 'chamadoStep', 'corretiva');
        v_response := '✅ Placa selecionada: **' || v_placa || E'**\n\n\U0001F527 É uma **manutenção corretiva**?\n\nResponda: **Sim** ou **Não**';
      end if;

    elsif v_step = 'corretiva' then
      if v_input in ('sim','s') then
        v_state := v_state || jsonb_build_object('corretiva', true, 'chamadoStep', 'local');
        v_response := E'✅ Corretiva: **Sim**\n\n\U0001F4CD Qual o **local** do atendimento?\n\nResponda: **Canteiro** ou **Oficina**';
      elsif v_input in ('não','nao','n') then
        v_state := v_state || jsonb_build_object('corretiva', false, 'chamadoStep', 'local');
        v_response := E'✅ Corretiva: **Não**\n\n\U0001F4CD Qual o **local** do atendimento?\n\nResponda: **Canteiro** ou **Oficina**';
      else
        v_response := '❌ Responda apenas **Sim** ou **Não**';
      end if;

    elsif v_step = 'local' then
      if v_input = 'canteiro' or v_input = 'oficina' then
        v_state := v_state || jsonb_build_object('local', initcap(v_input), 'chamadoStep', 'descricao');
        v_response := '✅ Local: **' || initcap(v_input) || E'**\n\n\U0001F4DD Descreva o **problema/serviço necessário**:';
      else
        v_response := '❌ Responda apenas **Canteiro** ou **Oficina**';
      end if;

    elsif v_step = 'descricao' then
      v_state := v_state || jsonb_build_object('descricao', coalesce(v_msg,''));
      v_raw := public.bot_http_fetch(gs_url, 'POST', jsonb_build_object(
        'placa', v_state->>'placa',
        'corretiva', case when (v_state->>'corretiva')::boolean then 'Sim' else 'Não' end,
        'local', v_state->>'local',
        'descricao', v_state->>'descricao'));
      if v_raw is not null then
        v_ok := true;
        begin
          v_chamado := v_raw::jsonb;
        exception when others then v_chamado := null; end;
      end if;

      if v_conv is not null and v_company is not null then
        begin
          insert into public.chamados (company_id, conversation_id, numero_chamado, google_sheet_id,
                                       placa, corretiva, local, agendamento, descricao, status)
          values (v_company, v_conv,
                  coalesce(v_chamado->>'numeroChamado', v_state->>'numeroPrevisto', 'N/A'),
                  v_chamado->>'ID',
                  v_state->>'placa', coalesce((v_state->>'corretiva')::boolean, false),
                  v_state->>'local', null, v_state->>'descricao', 'aberto');
        exception when others then null; end;
        update public.conversations
          set status = 'resolved',
              metadata = coalesce(metadata,'{}'::jsonb) || '{"chamadoStep":"finalizado"}'::jsonb,
              updated_at = now()
        where id = v_conv;
      end if;

      if v_ok then
        v_state := v_state || jsonb_build_object('chamadoStep','finalizado','mode','menu');
        v_response := E'✅ **Chamado criado com sucesso!**\n\n\U0001F3AB **Número:** '
          || coalesce(v_chamado->>'numeroChamado', v_state->>'numeroPrevisto', 'N/A')
          || E'\n\U0001F4C4 **ID:** ' || coalesce(v_chamado->>'ID','N/A')
          || E'\n\U0001F697 **Placa:** ' || coalesce(v_state->>'placa','')
          || E'\n\U0001F4DD **Descrição:** ' || coalesce(v_state->>'descricao','')
          || E'\n\n✨ Em breve entraremos em contato!\n\nDigite **0** para voltar ao menu.';
        perform public.bot_http_fetch(gs_url || '?action=enviarUltimaLinhaSuporte');
      else
        v_state := v_state || jsonb_build_object('mode','menu');
        v_response := '❌ Erro ao criar chamado. Por favor, fale com um atendente digitando **2**.';
      end if;

    else
      v_state := v_state || jsonb_build_object('mode','menu');
      v_response := 'Digite **0** para voltar ao menu principal.';
    end if;
  end if;

  v_response := public.sanitize_agent_names_text(v_response);

  if v_response <> '' and v_conv is not null then
    insert into public.messages (conversation_id, sender_type, content, metadata)
    values (v_conv, 'bot', v_response,
            jsonb_build_object(
              'options', case when jsonb_array_length(v_options) > 0 then v_options else null end,
              'response_state', v_state)
            || case when v_request is null then '{}'::jsonb else jsonb_build_object('request_id', v_request) end)
    returning id into v_msg_id;
  end if;

  return jsonb_build_object(
    'message', v_response,
    'messageId', v_msg_id,
    'state', v_state,
    'options', case when jsonb_array_length(v_options) > 0 then v_options else null end,
    'mode', coalesce(v_state->>'mode', v_mode));
exception when unique_violation then
  select id, content, metadata into v_existing
  from public.messages
  where conversation_id = v_conv and sender_type = 'bot' and metadata->>'request_id' = v_request
  limit 1;
  if found then
    return jsonb_build_object('message', v_existing.content, 'messageId', v_existing.id,
      'state', coalesce(v_existing.metadata->'response_state', v_state),
      'options', v_existing.metadata->'options',
      'mode', coalesce(v_existing.metadata->'response_state'->>'mode', v_mode), 'replayed', true);
  end if;
  raise;
end
$fn$;

grant execute on function public.web_bot_process(jsonb) to anon, authenticated, service_role;