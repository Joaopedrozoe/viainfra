# Inbox: mídia, reações, ligações e conformidade WhatsApp API oficial

Plano para os 10 pontos, sem envios de teste em produção sem alinhamento prévio.

## 1. Rolagem ao abrir a conversa
Situação atual verificada: `ChatWindow` faz scroll ao final com `requestAnimationFrame` + timeouts, mas o efeito depende de `messages.length`, então imagens/áudios que medem altura depois (e o cache `scrollPositionsCache`) deixam a conversa parada em mensagens antigas.

Correção:
- Ancorar por conversa: enquanto a conversa não estiver "pronta", manter o container colado no fim usando `ResizeObserver` no conteúdo (dispara re-ancoragem quando mídia mede altura), liberando quando o usuário rolar manualmente.
- Só restaurar a posição salva quando o usuário tinha rolado para trás na sessão atual; ao abrir a conversa de novo, abrir sempre nas mensagens recentes.
- Manter o carregamento de histórico (rolar para cima) sem ser afetado pela âncora.

## 2 e 5. Recebimento e envio de mídia/anexos (todos os formatos)
- Receber: normalizar no webhook todos os tipos da API oficial — imagem, vídeo, áudio/PTT, documento, sticker, contato (vCard), localização, e mensagens não suportadas — sempre baixando a mídia via Graph API e persistindo em Storage, com `mimeType`/`filename` gravados no metadata.
- Exibir: `MessageItem` passa a ter render dedicado por tipo (sticker, vCard, localização, documento com ícone e download, áudio com player), além de fallback claro quando a mídia expirou.
- Enviar: o app hoje só monta imagem, vídeo, áudio e documento. Passa a aceitar todos os tipos permitidos pela API oficial com validação de mime e tamanho por tipo (limites oficiais da Meta), upload para `chat-attachments` e mensagem de erro objetiva quando o formato não é suportado.
- Botão de anexo no `ChatInput` com seleção por categoria e validação antes do upload.

## 3. Reações
Situação atual verificada: reações chegam ao webhook e são gravadas como mensagem de texto solta; não existem reações vinculadas nem envio de reação.
- Nova tabela `message_reactions` (mensagem, emoji, autor, origem) com RLS por empresa e Realtime.
- Webhook passa a vincular a reação recebida à mensagem original (pelo id do WhatsApp) em vez de criar mensagem de texto; remoção de reação (emoji vazio) apaga o registro.
- UI: reações exibidas como chip abaixo da bolha; ação "Reagir" no menu de contexto com envio via API oficial.

## 4. Recursos da API oficial no inbox
Revisão e conformidade de: responder/citar, encaminhar, apagar para todos, marcar como lida, indicador de digitação, envio de template, reação. Cada ação passa a informar claramente quando a API oficial não permite (ex.: janela de apagar, edição), sem esconder falha.

## 6. Notificações
- Solicitação de permissão explícita nas configurações (sem pedido automático), som e notificação apenas para conversas não abertas, clique abre a conversa, deduplicação por mensagem e respeito às preferências salvas.

## 7. Recebimento de ligações
Situação atual verificada: o webhook já registra eventos de chamada recebida e existe `whatsapp-call-action` com `pre_accept`/`accept`/`reject`, mas o frontend não tem fluxo de atender.
- Diálogo de chamada entrante (toque, identificação do contato, atender/rejeitar), gerando SDP local e chamando `pre_accept`/`accept`, com áudio bidirecional pelo WebRTC já existente.
- Registro de duração/encerramento e entrada no histórico de chamadas.

## 8. Contatos sem telefone e template
Situação atual verificada no banco: Viainfra tem 3.867 de 5.091 contatos sem telefone e VIALOGISTIC 237 de 529. "Roberto - Frota Suzano" está sem telefone e sem `remoteJid`, por isso o template não é enviado. Há também contatos duplicados com o mesmo `remoteJid` (um com telefone, outro sem).
- Backfill: preencher telefone a partir do `remoteJid`, do mapeamento LID e do contato duplicado equivalente; consolidar duplicados por `remoteJid`/telefone.
- Prevenção: normalização de telefone centralizada usada por webhooks, importação e criação manual; contatos sem telefone identificável ficam marcados como "sem número" no app.
- Template: o botão passa a validar antes do envio e, quando não há telefone, oferece informar/corrigir o número do contato na hora em vez de falhar.

## 9 e 10. Produção e estabilidade
- Nenhum envio de mensagem de teste sem seu aval; validação por leitura de dados, logs e checagem de tipos.
- Alterações incrementais, com fallback para o comportamento atual em cada ponto, e correções estruturais (normalização, deduplicação, validação) para que os casos específicos não voltem a acontecer.

## Detalhes técnicos
- Frontend: `ChatWindow.tsx`, `MessageItem.tsx`, `ChatInput.tsx`, `MessageActions.tsx`, `chat/types.ts`, `useInfiniteMessages.ts`, `useNotifications.ts`, `useCalls.ts`, `calls/ActiveCallDialog.tsx`, `lib/whatsapp-call-webrtc.ts`.
- Backend: `evolution-webhook`, `evolution-webhook-vialogistic`, `send-whatsapp-message`, `send-whatsapp-template`, `whatsapp-call-action`, nova função de reação.
- Banco: `message_reactions` (grants + RLS + Realtime), backfill/dedup de contatos, índice de apoio para reações.

## Ordem de execução
1. Rolagem (1) — baixo risco, efeito imediato.
2. Mídia recebida/enviada (2, 5).
3. Contatos sem telefone e template (8).
4. Reações (3) e demais ações do menu (4).
5. Notificações (6).
6. Recebimento de ligações (7).

Cada etapa é entregue para sua validação antes da próxima.

## Reforços aprovados (conformidade, idempotência e reversão)

### Conformidade total com a API oficial da Meta
- Revisão completa do inventário de recursos suportados pela Cloud API e mapeamento do que o app cobre: mensagens de texto, mídia (imagem, vídeo, áudio/PTT, documento, sticker), localização, contatos, reações, respostas/citação, templates, marcação de lida, indicador de digitação, chamadas e status de entrega (sent/delivered/read/failed).
- Tratamento explícito dos códigos de erro da Meta (janela de 24h, template inválido, mídia expirada, número inválido), com mensagem clara no inbox em vez de falha silenciosa.

### Idempotência dos webhooks
- Chave de idempotência por `message_id` da Meta/Evolution: nenhum evento reprocessado cria mensagem, contato, conversa, chamada ou reação duplicada.
- Restrição de unicidade no banco para o id externo da mensagem e para reação (mensagem + autor), garantindo a proteção no nível do dado e não apenas no código.
- Atualizações de status aplicadas apenas quando avançam o estado (não regridem `read` para `sent`), e eventos fora de ordem descartados com segurança.

### Prevenção definitiva de recorrência
- Regras no banco (unicidade, normalização e validação por trigger) para que telefone ausente/mal formatado e duplicidade não voltem a ser possíveis, independentemente da origem (webhook, importação, criação manual).
- Roteamento por `phone_number_id` validado em todas as entradas, evitando cruzamento entre VIAINFRA e VIALOGISTIC.

### Reversão rápida
- Cada etapa entregue de forma isolada e independente, podendo ser revertida pelo histórico do projeto sem desfazer as demais.
- Alterações de banco pensadas como aditivas (novas colunas/tabelas e restrições), sem remover dados existentes, para que a reversão de código não deixe o banco inconsistente.
- Antes de cada etapa que toca dados, registro do estado atual para permitir retorno.
