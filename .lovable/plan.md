
Objetivo: fazer editar, apagar e encaminhar anexos refletirem de verdade no WhatsApp, sem “sucesso local falso”, e manter o inbox consistente com o estado real.

1. Diagnóstico do que está quebrado hoje
- Editar: `ChatWindow.handleSaveEdit` atualiza o banco e a UI primeiro, e só depois tenta editar no WhatsApp. Se a API falha, fica “editado” só no CRM.
- Apagar: `ChatWindow.handleConfirmDelete` sempre apaga do banco/local no final, mesmo quando a exclusão remota falha. Por isso a mensagem “some” e depois volta quando o sync/webhook reencontra a mensagem real no WhatsApp.
- Encaminhar anexo/documento: `ForwardMessageModal` só cria uma nova mensagem de texto com `↪️ Encaminhada...`; o `attachment` original nunca é reenviado ao WhatsApp.
- Risco adicional: editar/apagar usam `conversation.metadata.instanceName`; o envio normal resolve instância pela `company_id` da conversa. Isso pode falhar ou até contrariar a regra mestra de separação se o metadata estiver stale.

2. Ajustes de implementação
- Editar mensagens
  - Mudar o fluxo para WhatsApp: tentar editar remotamente primeiro.
  - Só atualizar `messages.content` e `metadata.editedAt` se a Evolution confirmar sucesso.
  - Se falhar, manter o conteúdo original e mostrar erro claro.
  - Resolver a instância com a mesma lógica estrita do envio principal: por `company_id` + validação de prefixo autorizado, sem depender de `metadata.instanceName`.
  - Preservar edição apenas local para canais não-WhatsApp.

- Apagar mensagens
  - Aplicar a preferência que você definiu: “bloquear remoção”.
  - Para conversas WhatsApp: só deletar do banco/UI se a exclusão remota for confirmada.
  - Se falhar por limite, permissão, mensagem recebida ou erro da API, a mensagem permanece visível com toast/status de falha.
  - Remover o comportamento atual de “apagar local mesmo com falha remota”.
  - Também usar resolução estrita da instância por `company_id`.

- Encaminhar anexos/documentos
  - Reescrever `ForwardMessageModal` para encaminhar o `attachment` real quando existir.
  - Se a origem tiver anexo:
    - inserir a nova mensagem destino com `metadata.attachment`
    - invocar `send-whatsapp-message` com `attachment`
    - enviar caption/texto complementar quando houver
  - Se for só texto, manter o fluxo textual.
  - Marcar metadados de encaminhamento sem perder o anexo original.

3. Garantia geral para não repetir
- Centralizar a resolução de instância usada por:
  - envio normal
  - editar
  - apagar
  - encaminhar
- Regra única:
  - nunca usar fallback hardcoded
  - nunca confiar só em `metadata.instanceName`
  - sempre resolver pela `company_id` da conversa e validar prefixo permitido

4. Sincronização com estado real do WhatsApp
- Revisar webhook/sync para refletir alterações remotas também:
  - tratar eventos de revogação/exclusão (`protocolMessage`/equivalente) para marcar/remover corretamente no CRM
  - tratar edições remotas, se a Evolution entregar esse evento/estrutura
- Ajustar o inbox para não depender de “estado local otimista” como fonte de verdade em ações destrutivas.

5. Arquivos principais a revisar
- `src/components/app/ChatWindow.tsx`
- `src/components/app/chat/ForwardMessageModal.tsx`
- `supabase/functions/send-whatsapp-message/index.ts`
- `supabase/functions/evolution-webhook/index.ts`
- `supabase/functions/evolution-webhook-vialogistic/index.ts`

6. Resultado esperado
- Editar só altera no CRM quando realmente alterou no WhatsApp.
- Apagar não some localmente se não apagou para todos no WhatsApp.
- Encaminhar imagem/vídeo/áudio/documento envia o arquivo de verdade, não apenas um texto placeholder.
- O comportamento fica consistente para grupos e conversas individuais, sem quebrar a separação entre instâncias/empresas.

Detalhes técnicos
- Não vejo necessidade de mudança de schema neste momento.
- O principal problema é de fluxo e de fonte de verdade: hoje as ações de editar/apagar são otimistas demais, e o encaminhamento ignora `attachment`.
- Como complemento de robustez, vale adicionar assinatura realtime para `UPDATE` em `messages` no chat, para refletir mudanças de metadata/status sem depender de reload manual.
