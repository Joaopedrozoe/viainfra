# Roberto - Frota Suzano: contato duplicado pela importação do backup

## Você está certo — e os dados confirmam

A mensagem `*Suelem Souza* Amanhã cedinho te confirmo` (12/05 16:33) **foi enviada pelo app**: o prefixo `*Nome do atendente*` é gerado pelo próprio `send-whatsapp-message`.

O que aconteceu foi outra coisa: existem **duas** entradas para o mesmo Roberto na VIAINFRA.

```text
Conversa original (envio real pelo app)
  contato: "5511978438886"   phone: 5511978438886   jid: 5511978438886@s.whatsapp.net
  conversa b2277abf...       22 mensagens com os MESMOS ids do WhatsApp

Conversa criada pela importação do backup (28/07)
  contato: "Roberto - Frota Suzano"   phone: null   jid: null
  conversa d03b615d...       38 mensagens, todas com source = backup-import
```

Cruzando os `external_id` (ids reais do WhatsApp) das mensagens importadas, **22 delas já existiam** na conversa `b2277abf`, cujo contato tem o telefone `5511978438886`. Ou seja: o número sempre existiu na base; a importação criou um contato/conversa paralelos sem telefone e sem JID, e é nessa cópia que você está tentando enviar o template.

Isso corrige a explicação anterior: o problema não é "backup sem número", é **duplicação na importação** — e o número é recuperável de forma determinística pelo id da mensagem.

## O que vou fazer

### 1. Recuperar telefone por cruzamento de id de mensagem (determinístico)
Para cada contato sem telefone, cruzar os `external_id` das mensagens dele com mensagens já existentes em outras conversas da mesma empresa. Quando houver conversa correspondente com telefone/JID, herdar o número (e o JID). Roda em **simulação primeiro**, eu te mostro a lista (contato → número → nº de mensagens em comum) antes de aplicar.

### 2. Mesclar as conversas duplicadas em vez de deixar duas
Para os pares confirmados pelo cruzamento: manter uma única conversa por contato/telefone, mover as mensagens que só existem na cópia importada, descartar as repetidas por id, e preservar o nome mais informativo (`Roberto - Frota Suzano` em vez de `5511978438886`). Nada é apagado sem correspondência de id — mensagem sem par é sempre mantida.

### 3. Passes complementares para os que sobrarem
Em ordem de confiança: JID/LID (`lid_phone_mapping`), telefone presente no texto/vCard das mensagens, e por fim nome normalizado contra a lista oficial de chats da instância. Só aplica correspondência única; ambíguo fica para preenchimento manual.

### 4. Preenchimento manual assistido
Lista "contatos sem telefone" em Contatos, com o diálogo já existente para informar o número (validação de formato e de duplicidade). No inbox, quando o contato não tem número, a ação de enviar/template oferece "Informar telefone" em vez de falhar.

### 5. Prevenção — para não gerar isso de novo
- Importação de backup passa a fazer *match* antes de criar: pelo id das mensagens e pelo nome/telefone, anexando à conversa existente em vez de criar uma nova.
- Unicidade no banco por id externo de mensagem e por contato/telefone da empresa, para bloquear duplicidade na origem, independentemente de webhook, importação ou criação manual.
- Envio só é gravado após confirmação do provedor: hoje a mensagem `"Olá bom dia Roberto"` (03/08) está gravada **sem** id da Meta, ou seja, aparece como enviada mas não foi aceita. Passa a não gravar em caso de falha, e as mensagens antigas nessa situação ficam marcadas como falhas.
- Checagem periódica reportando contatos sem telefone, conversas duplicadas e mensagens sem confirmação.

## Detalhes técnicos
- `recover-contact-phones`: novos passes (cruzamento por `external_id`, LID, texto/vCard, nome) com modo `dryRun` e limite por lote.
- Nova rotina de merge de conversa/contato duplicados, transacional e idempotente, sem exclusão de mensagens sem par.
- Banco (aditivo): índices/restrições de unicidade para `external_id` de mensagem e telefone por empresa; nenhum `DROP`.
- `import-chat-backup`: resolução de contato existente antes de inserir.
- Frontend: `Contacts.tsx` (lista sem telefone), `ChatWindow.tsx`/`ChatInput.tsx` (bloqueio + ação de informar número, estado de falha real de envio).
- Produção: nenhum envio de mensagem de teste sem sua autorização; toda correção de dados roda em simulação e é apresentada antes de aplicar.
