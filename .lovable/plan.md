# Anexos no inbox + iniciar conversa com cadastro rápido

## 1. Anexos nas conversas (revisão e correção)

Situação verificada:
- O fluxo existe e é coerente: `ChatInput` valida formato/tamanho pelas regras oficiais, `ChatWindow` faz upload para o bucket `chat-attachments` (bucket público, com política de upload para usuários autenticados — OK) e chama `send-whatsapp-message` com o anexo.
- Lacunas confirmadas no envio (`send-whatsapp-message`):
  - O tipo aceito é apenas `image | video | audio | document`. **Sticker** cai no `default` e é enviado como texto "[Arquivo]" — o arquivo simplesmente não chega.
  - Áudio é enviado sem a legenda: se a atendente escrever um texto junto do áudio, esse texto é perdido.
  - Falha de upload interrompe o envio, mas a mensagem já pode ter sido montada localmente sem retorno claro.
- O botão de anexo é um ícone único, sem indicação do que é aceito, e não há barra/estado de progresso durante upload de arquivos grandes.

Ajustes:
- Enviar sticker pelo endpoint próprio da Evolution (`sendSticker`) e, quando o formato não for compatível com sticker, enviar como imagem em vez de virar texto.
- Enviar a legenda do áudio como mensagem de texto complementar, para nada ser perdido.
- Erro de upload/envio passa a marcar a mensagem como falha com motivo objetivo (formato, tamanho, rede) e permitir reenviar.
- Indicador de "enviando anexo" no input (desabilitar o botão enviar durante o upload) e menu de anexo com categorias (imagem/vídeo, áudio, documento) usando as mesmas regras de validação já existentes.

## 2. Iniciar conversa + cadastro rápido no inbox

Hoje não existe nenhuma forma de iniciar uma conversa com quem não está na lista: a lista de conversas só mostra o que já existe, e a página de contatos apenas cria o registro.

Novo recurso — botão "Nova conversa" no topo da lista de conversas do inbox, abrindo um diálogo com:
- Campo de telefone (com normalização automática para o padrão internacional) e campo de nome.
- Busca automática pelo telefone informado dentro da empresa atual:
  - já existe conversa: abre a conversa existente (sem duplicar nada);
  - existe contato sem conversa: cria a conversa e abre;
  - não existe: cria contato + conversa e abre, com o nome informado.
- Aviso claro quando não houver janela de 24h aberta, com atalho para disparar um template aprovado (usando o seletor de templates já existente), que é o único caminho permitido pela API oficial para iniciar contato.
- Validação antes de criar: telefone inválido/curto é recusado com mensagem explicando o formato.

## 3. Conformidade e estabilidade na página de contatos

Situação verificada em `CreateContactModal`: não normaliza o telefone, não verifica duplicidade e recarrega a página inteira (`window.location.reload()`) ao final.

Ajustes:
- Normalizar o telefone antes de gravar (mesma regra usada pelo banco) e bloquear duplicidade: se já existir contato com aquele telefone na empresa, oferecer abrir o contato existente em vez de criar outro.
- Trocar o recarregamento de página por atualização da lista em memória.
- Ação "Iniciar conversa" no contato, reaproveitando exatamente o mesmo fluxo do inbox (contato existente → conversa existente ou nova).

## Detalhes técnicos

- Frontend: `ChatInput.tsx`, `ChatWindow.tsx`, `ConversationList.tsx` (ou `conversation/SearchHeader.tsx`) para o botão, novo `chat/NewConversationDialog.tsx`, novo hook `useStartConversation.ts`, `contacts/CreateContactModal.tsx`, `pages/app/Contacts.tsx`, `pages/app/Inbox.tsx`.
- Backend: `supabase/functions/send-whatsapp-message` (sticker, legenda de áudio, erros).
- Banco: nenhuma mudança de schema. O trigger `ensure_contact_phone` e `normalize_phone` já existentes cuidam da normalização no servidor; a criação de contato/conversa usa as políticas RLS atuais por empresa.
- Isolamento por empresa preservado: contato e conversa criados sempre com o `company_id` do perfil logado, sem fallback entre Viainfra e Vialogistic.

## Ordem de execução e validação

1. Correções de anexo (sticker, legenda de áudio, erros e estado de upload) — validação por leitura de logs e um envio controlado, com seu aval antes de qualquer disparo real.
2. Diálogo "Nova conversa" no inbox — validado abrindo a interface no navegador e testando telefone existente, telefone novo e telefone inválido, sem enviar mensagem.
3. Página de contatos (normalização, duplicidade, iniciar conversa) — validado com contato duplicado e contato novo.

Cada etapa é entregue de forma isolada, sem alterar comportamento existente que já funciona, e reversível pelo histórico do projeto.
