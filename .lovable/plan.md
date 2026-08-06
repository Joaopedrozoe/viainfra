# Roberto - Frota Suzano: por que há mensagens sem telefone

## O que os dados mostram (verificado agora no banco)

Contato `Roberto - Frota Suzano` (VIAINFRA), criado em 28/07/2026: `phone = null`, `metadata.remoteJid = null`.

A conversa dele tem `metadata.source = "backup-import"` e **todas** as mensagens antigas — incluindo `"*Suelem Souza* Amanhã cedinho te confirmo"` de 12/05 16:33 — têm no metadata:

```text
source: "backup-import"
importedAt: "2026-07-28T15:09:08.103Z"
external_id: 3EB0869463EACDA727CA30
fromMe: true
```

Ou seja: essa mensagem **não foi enviada pelo app**. Ela foi gravada durante a importação do backup de conversas (foi enviada no WhatsApp, em maio, antes de existir esse contato aqui). Por isso aparece como `agent` na conversa sem que o app tenha o telefone.

A única mensagem realmente originada no app nessa conversa é `"Olá bom dia Roberto, tudo bem?"` de 03/08 10:18 — e ela está com `metadata` **vazio**, sem `messageId` da Meta. Isto é, foi gravada na tela mas **não foi aceita/entregue** pelo provedor. Ela ficou como falso positivo de "mensagem enviada".

Conclusão: não há inconsistência na explicação anterior sobre o telefone, mas há dois defeitos reais a corrigir:
1. o backup importou nome/mensagens sem trazer o número (o arquivo de backup não tem JID), deixando 76 contatos importados da VIAINFRA sem telefone (3.400 no total da base, contando outras origens);
2. o app grava a mensagem na conversa mesmo quando o envio falha, o que dá a impressão de que enviou.

## O que vou fazer

### 1. Parar de gravar mensagem quando o envio falha
Só persistir a mensagem depois da confirmação do provedor (id da Meta/Evolution). Se falhar, nada é gravado e o erro aparece na tela. Além disso, marcar retroativamente as mensagens `agent` sem `messageId` e sem `source` como `failed`, para a conversa deixar de mentir sobre o histórico.

### 2. Recuperar os telefones de forma sistemática (não caso a caso)
Ampliar a função `recover-contact-phones` com passes em ordem de confiança, sempre com **dry-run primeiro**:
- casar `external_id` das mensagens importadas com mensagens já existentes na base que tenham JID/telefone (mesma mensagem, outra conversa);
- casar por nome normalizado com a lista de chats/contatos oficiais da instância e com contatos da mesma empresa que já têm telefone;
- usar `lid_phone_mapping` quando houver LID.
Só aplica o que tem correspondência única; ambiguidade fica de fora e vai para preenchimento manual.

### 3. Preenchimento manual assistido para o resto
Na tela de contatos e no aviso da conversa, listar os contatos sem telefone com campo para informar o número, validando formato e duplicidade antes de salvar (usa o `MissingPhoneDialog` já existente, agora acessível a partir de uma lista "sem telefone").

### 4. Prevenção para não repetir
- Importador de backup: exigir/registrar telefone ou JID quando disponível e marcar a conversa como `importOnly` quando não houver, com aviso claro no inbox de que não é possível enviar até informar o número.
- Bloquear envio e envio de template quando o contato não tem telefone, com a ação "Informar telefone" no lugar do botão.
- Verificação periódica que reporta contatos sem telefone e mensagens `agent` sem confirmação, para detecção precoce.

## Detalhes técnicos

- Frontend: `src/hooks/useConversations.ts` / componentes de envio em `src/components/app/chat/` (ChatInput, ChatWindow) — persistir só após retorno com id do provedor; estado otimista revertido em falha.
- Edge functions: `send-whatsapp-message` e `send-whatsapp-template` retornam erro estruturado; `recover-contact-phones` ganha os passes de matching e modo `dryRun`.
- Banco: migração para marcar mensagens `agent` sem `messageId`/`source` como `metadata.status = 'failed'`; nenhuma exclusão de dados.
- Produção: nenhum envio real de mensagem será feito sem sua autorização; recuperação de telefones roda em simulação e eu te mostro os números antes de aplicar.
