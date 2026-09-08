# Grupos, anexos, contatos, ligações e IA "Vivi" (Viainfra + Vialogistic)

Cinco frentes, executadas em sequência e validadas ao final em navegador real. Tudo vale para as duas empresas, sempre com separação estrita por empresa (instância, credencial Meta, dados e visual). Nenhum disparo real de WhatsApp será feito sem sua autorização explícita do número de destino.

## 1. Grupos na API oficial

Situação atual: o app já grava mensagens de grupo recebidas (contato sintético "grupo" + conversa), mas a tela não diferencia grupo de contato, não mostra quem falou, e o envio para grupos falha de forma intermitente (existem várias funções de diagnóstico abandonadas com erro "not-acceptable").

O que será feito:
- Inbox: ícone e nome do grupo, nome/telefone do participante em cada mensagem recebida, contagem de membros no cabeçalho; filtro "Grupos" na lista.
- Envio para grupos: texto, mídia, resposta/citação e reações, com pré-checagem de participação do número da empresa e erro claro quando a instância não faz parte do grupo.
- Painel do grupo (aba lateral): descrição, foto, lista de participantes com cargo, adicionar/remover membro, promover/rebaixar admin, editar nome/descrição/foto, gerar/revogar link de convite, restringir envio a admins, sair do grupo.
- Nova conversa: criar grupo (nome + participantes da lista de contatos da empresa).
- Página de grupos por empresa (listar grupos da instância e sincronizar com o inbox).
- Limpeza das funções de diagnóstico de grupo abandonadas.

Observação: a Meta libera recursos de grupo por conta (WABA). Cada função verifica a resposta real da API e mostra na tela quando a Meta não habilitou aquele recurso para a conta, em vez de falhar silenciosamente.

## 2. Anexos: todos os formatos + arrastar e soltar

Situação atual: envio de imagem, vídeo, áudio, documento e figurinha funciona pela biblioteca compartilhada; localização só é exibida quando recebida; não há envio de localização nem de cartão de contato; não há arrastar e soltar.

O que será feito:
- Arrastar e soltar arquivos na conversa (área de destaque ao arrastar, múltiplos arquivos em fila, pré-visualização e legenda antes de enviar). Colar imagem da área de transferência também.
- Enviar localização (busca de endereço/coordenadas ou coordenadas atuais) e cartão de contato (escolher da lista de contatos da empresa).
- Revisão dos limites da Meta por tipo (tamanho, formatos aceitos) com mensagem amigável antes do envio, e conversão automática quando cabível (ex.: áudio para OGG/Opus, figurinha para WebP).
- Recebimento: garantir renderização de todos os tipos (imagem, vídeo, áudio, documento, figurinha, localização, contato, enquete, reação) e download quando a mídia expira na Meta.

## 3. Criar contato e nova conversa no inbox (erro atual)

Situação atual: as telas e a lógica existem; a causa mais provável do erro é a regra de segurança do banco que exige que a empresa do usuário (perfil) seja igual à empresa ativa — usuários com acesso às duas empresas falham quando a empresa ativa difere do perfil. Isso será confirmado reproduzindo o erro no navegador antes de corrigir.

O que será feito:
- Ajustar as regras de acesso de contatos e conversas para aceitar também a tabela de acesso multiempresa (mesma lógica já usada nas prévias do inbox).
- Mostrar o erro real na tela (hoje aparece genérico) e impedir duplicidade de telefone na mesma empresa com aviso claro.
- Validar: criar contato na página Contatos, "Nova conversa" no inbox com número novo e com número existente, nas duas empresas.

## 4. Ligações: estabilidade e sincronização entre atendentes

Situação atual: a chamada entrante toca para todos os atendentes da empresa; não há registro de quem atendeu, então a janela pode continuar aberta para os demais.

O que será feito:
- Registrar quem atendeu/recusou a chamada (novo campo na chamada) e fechar imediatamente a janela "chamando" para os outros atendentes; se dois clicarem em atender ao mesmo tempo, apenas o primeiro assume, o outro recebe "atendida por Fulano".
- Encerramentos e falhas sincronizados em tempo real para todos; tempo máximo de toque com registro como perdida; reconexão automática do canal em tempo real ao voltar da aba em segundo plano.
- Histórico mostra o atendente responsável; permissão de microfone pedida antes de tocar; toque sonoro só para quem ainda pode atender.

## 5. IA "Vivi" com Google Gemini (sem créditos Lovable)

Provedor: API direta do Google Gemini (plano gratuito). Você cria a chave gratuita no Google AI Studio e eu a guardo em segredo no projeto; a chave nunca fica no app.

Identidade: mesmo nome "Vivi" nas duas empresas; na Vialogistic usa o amarelo/cinza da imagem de referência, na Viainfra o verde do logo da Viainfra. Personalidade conforme a referência: acolhedora, ágil, confiável, "pode deixar comigo", foco no cliente. Avatar gerado a partir da referência, com variação de cor de uniforme por empresa.

Modo inicial (somente aprendizado, sem ação nas conversas):
- Leitura retroativa pontual: processa o histórico de conversas da empresa em lotes, respeitando o limite gratuito do Gemini, com barra de progresso.
- Leitura permanente: a cada nova mensagem que chega, a Vivi analisa a conversa em segundo plano (agendado a cada poucos minutos) e registra insights.
- Insights gerados por conversa e consolidados: temas mais frequentes, sentimento, motivos de contato, gargalos de atendimento, perguntas sem resposta, sugestões de respostas prontas e de templates, oportunidades por setor.
- Separação total por empresa: dados, insights, progresso e visual da Vivi da Viainfra nunca se misturam com os da Vialogistic.

Página "Agentes de IA" (reaproveitada, hoje é mock):
- Card da Vivi com avatar, nome, cores da empresa, status e progresso de aprendizado (conversas lidas / total, última leitura).
- Aba Insights: painel com gráficos e lista filtrável por período, setor e tema, com link para a conversa de origem.
- Aba Aprendizado: iniciar/pausar leitura retroativa, frequência da leitura contínua, consumo do limite gratuito.
- Aba Personalidade: nome, tom, descrição e cores (por empresa), para uso futuro quando decidirmos ações efetivas.

## Validação antes de concluir

- Teste em navegador real (sessão autenticada) das duas empresas: criar contato, nova conversa, arrastar anexo, abrir grupo, ver painel da Vivi.
- Verificação de logs das funções e da fila de leitura da IA.
- Envio real de WhatsApp (mensagem, mídia, grupo) só com número de destino autorizado por você.

## Detalhes técnicos

- Grupos: novas funções `whatsapp-group-action` (create, participants add/remove/promote/demote, updateSubject/Description/Picture, inviteCode/revoke, settings, leave) e `list-whatsapp-groups`, usando os endpoints `/group/*` da Evolution por instância/empresa; `conversations.metadata.isGroup`, `messages.metadata.participant` já gravados pelo webhook passam a ser exibidos; componente `GroupInfoPanel`, filtro na `ConversationList`, `CreateGroupDialog`. Remoção de `debug-group-send*`, `test-group-send*`, `final-group-test`, `force-send-group`, `diagnose-groups*`.
- Anexos: `ChatInput`/`ChatWindow` com `onDragOver/onDrop`/`onPaste`, fila de anexos com legenda; `send-whatsapp-message` ganha casos `location` e `contacts`; `whatsapp-media.ts` amplia tipos e limites por formato; `MessageItem` renderiza contato e enquete recebidos.
- Contatos/conversas: migração ajustando políticas de INSERT/UPDATE de `contacts` e `conversations` para `company_id IN (get_user_company_ids(auth.uid()) UNION company_access)`; toasts com mensagem do erro real.
- Ligações: migração adicionando `calls.answered_by uuid`, `answered_by_name text`, `ring_deadline`; `whatsapp-call-action` aceita/recusa com `UPDATE ... WHERE status='ringing' AND answered_by IS NULL` (primeiro ganha); `useIncomingCalls` fecha o diálogo ao ver `answered_by` de outro usuário; `calls` já está no realtime.
- IA: tabelas `ai_agents` (por empresa: nome, cores, personalidade, status, progresso), `ai_insights` (empresa, conversa, tipo, resumo, score, dados json), `ai_learning_jobs` (fila/progresso). Funções `vivi-analyze-conversation` (Gemini `gemini-2.0-flash` via REST `generativelanguage.googleapis.com`, chave `GEMINI_API_KEY`), `vivi-backfill` (lotes com respeito ao limite gratuito) e agendamento via `pg_cron` a cada 5 min para novas mensagens. Página `Agents.tsx` ligada às novas tabelas, com RLS por empresa. Segredo `GEMINI_API_KEY` solicitado a você na etapa 5.
