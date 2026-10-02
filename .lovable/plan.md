# Encaminhar, localizações e contatos nas conversas (Viainfra e Vialogistic)

## 1. Encaminhar visível e confiável
- Adicionar botão "Encaminhar" visível no balão da mensagem (ao passar o mouse e ao tocar no celular), além do menu do botão direito.
- Corrigir a validação no modal de encaminhar: localização e contato não exigem link de arquivo; manter coordenadas, nome, telefones e cartão.
- Envio de localização e contato encaminhados pelo formato nativo do WhatsApp (com texto de reserva se a Meta recusar).
- Lista de destino sempre limitada à empresa atual.

## 2. Recebimento correto de localizações e contatos
- Nos dois webhooks: não tentar baixar localização/contato como arquivo; gravar direto os dados estruturados.
- Minimapa: se faltar coordenada, mostrar card com nome/endereço e link de mapa, em vez de "mensagem não suportada".
- Contatos com vários números: mostrar todos.

## 3. Salvar contato recebido
- Novo botão "Salvar contato" no card de contato recebido.
- Verifica se o número já existe na empresa atual; se existir, oferece "Abrir conversa"; senão cadastra com nome e telefone normalizado (55).
- Mensagem de sucesso/erro clara.

## Validação
- Teste no navegador autenticado: encaminhar texto, imagem, localização e contato; salvar contato recebido; conferir separação por empresa.
- Nenhuma mensagem real enviada sem número autorizado (usar 553599534971 se necessário).

## Detalhes técnicos
- Arquivos: `MessageItem.tsx`, `MessageActions.tsx`, `ForwardMessageModal.tsx`, `send-whatsapp-message/index.ts`, `evolution-webhook/index.ts`, `evolution-webhook-vialogistic/index.ts`.
- Sem mudanças de banco; inserts de contato usam a tabela `contacts` com `company_id` atual.
- Alterações nos webhooks são cirúrgicas (guard antes de `downloadAndUploadMedia` para `location`/`contact`).
