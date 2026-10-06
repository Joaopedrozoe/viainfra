# Atualizações de segurança sem impacto na operação

Regra principal: tudo o que hoje funciona (webhooks, envio de mensagens, templates, ligações, bot, inbox, login e acessos das atendentes) precisa continuar funcionando igual. Cada etapa é validada antes de seguir para a próxima.

## Etapa 1 — Pacotes com falhas conhecidas
- Atualizar o gerador de PDF (`jspdf` 3.0.4 para 4.2.x), que tem falhas críticas.
- Atualizar o roteamento de páginas (`react-router-dom` para a última 6.x), sem mudar de versão principal.
- Atualizar o cliente do banco (`@supabase/supabase-js` para a última 2.x) e o pacote de gráficos (`recharts` para a última 2.x).
- Validar: compilação OK, páginas principais abrem e a geração de PDF continua funcionando.

## Etapa 2 — Regras de acesso do banco
Hoje algumas tabelas internas aceitam leitura e alteração por qualquer pessoa. As regras serão restritas ao sistema interno (que já opera com permissão própria e não é afetado):
- `bots`, `lid_phone_mapping`, `smtp_settings`, `whatsapp_instances`, `company_access`, `whatsapp_statuses`, `typing_status`: a regra "aberta para todos" vira "somente sistema interno".
- As regras atuais que já liberam as atendentes por empresa são mantidas como estão.
- Antes de remover qualquer regra aberta, conferir se existe uma regra equivalente para as atendentes; se não existir, criar uma restrita à empresa da atendente, para não cortar nenhuma tela.
- `contact_directory`: leitura limitada aos contatos da empresa da atendente (mais os registros sem empresa, como hoje).

## Etapa 3 — Arquivos (fotos, anexos, widget)
- Fotos de perfil: enviar, trocar e apagar ficam só para o sistema interno e usuários logados; a visualização pública continua.
- Anexos das conversas: apagar fica só para quem enviou o arquivo ou para o sistema interno; envio e visualização continuam como estão.
- Arquivos do widget: sem mudança de visualização; envio continua só para usuários logados.

## Etapa 4 — Funções internas do banco
- Remover a permissão de visitantes não logados nas funções internas (correções, gatilhos, busca HTTP do bot).
- Manter liberadas as funções que o chat web público e o inbox usam: `web_bot_process`, `get_web_conversation_messages`, `send_web_conversation_message`, `get_inbox_previews_compact`, `get_inbox_previews`, `claim_call`, `get_user_company_ids`, `is_admin`.
- Fixar o caminho seguro em `call_log_label`.

## Etapa 5 — Correções de estabilidade apontadas pelo monitoramento
- Encaminhar para contato da agenda: incluir a ligação que faltava, para não dar erro.
- Ligações: após desligar, a próxima ligação volta a discar normalmente.
- Trava de "linha ocupada": considerar a ligação viva pela atualização mais recente, não só pelo início, evitando bloqueio falso e sobreposição.

## Validação final
- Rodar a varredura de segurança e o linter de novo e marcar como resolvidos os itens corrigidos.
- Teste no navegador logado: abrir inbox das duas empresas, abrir conversa, contatos e encaminhamento.
- Conferir os registros dos webhooks das duas empresas após a mudança.

## Fica de fora (exige ação sua ou mudança de plano)
- Proteção contra senhas vazadas: é ligada no painel do Supabase (plano Pro).
- Extensão instalada na área pública do banco: mover pode quebrar o bot; fica documentado sem mudança.
- Visualização pública de anexos e fotos: mantida, porque o WhatsApp e o inbox dependem dos links atuais.

## Detalhes técnicos
- Uma migração por etapa (2, 3 e 4), cada uma com `DROP POLICY IF EXISTS` + `CREATE POLICY ... TO service_role` e, quando faltar, política `TO authenticated` com `company_id IN (SELECT public.get_user_company_ids(auth.uid()))`.
- Etapa 4: `REVOKE EXECUTE ... FROM anon, public` só nas funções internas; funções de gatilho não precisam de EXECUTE do cliente.
- Arquivos: `ForwardMessageModal.tsx`, `ActiveCallDialog.tsx`, `initiate-whatsapp-call/index.ts`.
