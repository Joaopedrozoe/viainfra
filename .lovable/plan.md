## Objetivo

Subir o backup local (uma pasta por conversa, com `index.html`, `script.js`, `style.css` e subpasta de mídia) para o app, **completando** o que já existe no Inbox e em Contatos, sem criar duplicidade de conversas, contatos ou mensagens.

## O que já verifiquei no banco

- 66.809 mensagens, 792 conversas, 5.344 contatos (3.845 sem telefone).
- A chave de deduplicação mais usada hoje é `messages.metadata->>'external_id'` (53.534 mensagens), seguida de `whatsappMessageId` (7.883) e `messageId` (4.196).
- O `data-stanza-id` presente no HTML do backup é exatamente o ID de mensagem do WhatsApp, então serve como chave de dedupe contra esses três campos.

## Estratégia

### 1. Origem dos dados no HTML
O HTML não precisa ser "raspado" do DOM: todas as mensagens estão no array `window.CHAT_MESSAGES_HTML` dentro do `<script>`. O parser extrai esse array e, de cada item, lê:

- `data-stanza-id` → ID único da mensagem (dedupe)
- classe `message-row me | other` → `sender_type` (`agent` / `user`)
- `div.date-divider` (ex.: `2026/5/22`) + `span.time` (`09:17`) → `created_at`
- `div.text-content` → conteúdo
- `img/audio/video/a[href]` apontando para a subpasta de mídia → anexo
- blocos de citação → `quotedMessageId` / `quotedContent`
- nome do remetente em grupos → `sender_name`

O nome da pasta (ex.: `Central de Vendas Baterias V8`) é o nome da conversa/contato, e a empresa vem da pasta-pai (`vialogistic` / `viainfra`) ou de uma seleção explícita na tela.

### 2. Tela de importação no app (`/app/settings` → aba "Importar backup")
- Seleção de empresa (VIAINFRA ou VIALOGISTIC) — trava para o que o usuário tem acesso.
- Seleção de pasta via `webkitdirectory` (permite escolher a pasta raiz com todas as conversas de uma vez) ou upload de `.zip`.
- Fase 1 — **Análise local (sem gravar nada)**: lê todos os HTMLs no navegador, monta um relatório por conversa: nome, nº de mensagens, período, mídia encontrada, e o resultado do casamento com o banco (conversa existente / contato existente / nova).
- Fase 2 — **Revisão**: tabela onde você confirma ou corrige o casamento de cada conversa (vincular a um contato/conversa existente, criar novo, ou pular). Regras automáticas propostas ficam pré-selecionadas.
- Fase 3 — **Importação em lotes** com barra de progresso, pausar/retomar e log de erros.

### 3. Regras de deduplicação (o ponto central)

**Mensagem** — pula se `stanza-id` já existir em `metadata->>'external_id'`, `whatsappMessageId`, `messageId` ou `message_id` da mesma conversa. Fallback para mensagens antigas sem ID: mesma conversa + mesmo `sender_type` + mesmo texto normalizado + timestamp dentro de ±90s.

**Conversa/contato** — casamento em cascata, na ordem:
1. telefone normalizado (só dígitos, com DDI 55) se o backup expuser número;
2. `remoteJid` (grupos: `...@g.us`);
3. nome normalizado (minúsculas, sem acento/emoji/espaço extra) dentro da mesma empresa;
4. sem casamento → cria contato + conversa novos, marcados com `metadata.source = 'backup-import'`.

Nada é sobrescrito: nomes, fotos e metadados existentes ficam como estão; a importação só **acrescenta** mensagens e preenche campos vazios (ex.: contato sem telefone que o backup traz).

### 4. Mídia
Cada arquivo da subpasta vai para o bucket `chat-attachments` em `import/{company}/{conversationId}/{stanzaId}-{arquivo}`, com hash SHA-256 do conteúdo para evitar reupload do mesmo arquivo. A URL pública entra em `metadata.attachment`, no mesmo formato já usado hoje pelas mensagens com anexo, para renderizar igual no Inbox.

### 5. Volume (>500 conversas, >2 GB)
- Upload de mídia direto do navegador para o Storage (não passa por Edge Function) — evita limite de payload.
- Mensagens enviadas em lotes de 500 para uma Edge Function `import-chat-backup`, que faz o dedupe no servidor e o insert em massa.
- Progresso persistido na tabela `import_jobs` (já existe): se a aba fechar ou a internet cair, ao reabrir a tela a importação retoma de onde parou.
- Conversas processadas em série, com concorrência limitada (3 uploads simultâneos) para não estourar limites do Supabase.
- Ordenação: conversas mais recentes primeiro, para o Inbox ficar útil logo no começo.

### 6. Pós-importação
- `conversations.updated_at` recalculado pela mensagem mais recente (para a ordem do Inbox ficar correta).
- Relatório final baixável: por conversa, quantas mensagens importadas / puladas por duplicidade / com erro, e quanta mídia subiu.
- As mensagens importadas ficam com `metadata.source = 'backup-import'`, o que permite reverter uma importação inteira com um único comando caso algo saia errado.

## Detalhes técnicos

- **Novos arquivos**: `src/lib/backup-parser.ts` (parser do `CHAT_MESSAGES_HTML`), `src/lib/backup-import.ts` (orquestração/lotes/retomada), `src/components/app/settings/BackupImport.tsx` (UI de 3 fases), `supabase/functions/import-chat-backup/index.ts` (dedupe + insert em massa, com validação Zod e verificação de que o usuário tem acesso à empresa).
- **Migração**: índice em `messages ((metadata->>'external_id'))` e em `conversation_id, created_at` para o dedupe não ficar lento com 66k+ mensagens; nenhuma tabela nova (reaproveita `import_jobs`).
- **Sem alteração** em webhooks Evolution/Meta, envio de mensagens ou qualquer endpoint existente.

## Ordem de execução (com validação sua a cada etapa)

1. Parser + tela de análise (fase 1), somente leitura — você aponta a pasta e confere o relatório antes de qualquer gravação.
2. Após seu aval: migração dos índices + Edge Function de importação.
3. Importação piloto de **1 conversa** (a "Central de Vendas Baterias V8"), você valida no Inbox.
4. Importação piloto de ~20 conversas, nova validação.
5. Importação completa das duas empresas.
