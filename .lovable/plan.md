# Corrigir a criação de grupos sem tentativas cegas

## Objetivo
Identificar por que a Meta continua devolvendo `#131215` e corrigir apenas o ponto comprovadamente responsável, mantendo Viainfra e Vialogistic isoladas.

## Situação confirmada
- O app já chama diretamente a API oficial da Meta em `v26.0`.
- A criação envia `POST /<phone_number_id>/groups` com `messaging_product: "whatsapp"`, nome e descrição.
- A resposta `#131215` é devolvida pela própria Meta para o `phone_number_id` usado; os registros atuais da função não incluem detalhes suficientes para confirmar qual empresa, número e ativo empresarial foram efetivamente avaliados nessa tentativa.
- A função escolhe as credenciais pelo nome da empresa e ainda possui IDs de telefone padrão quando a configuração não está presente. Isso precisa ser eliminado ou validado, pois pode testar um número diferente do habilitado no painel.

## Etapas
1. **Diagnóstico sem criar grupo**
   - Consultar, para cada empresa, o número configurado, o WABA ao qual ele pertence e os recursos/permissões devolvidos pela Meta.
   - Confirmar que token, `phone_number_id`, WABA e empresa formam o conjunto correto, sem fallback entre empresas.
   - Não registrar tokens nem expor credenciais na tela ou nos logs.

2. **Corrigir a seleção de credenciais**
   - Remover IDs de telefone padrão da função de grupos.
   - Exigir a configuração explícita de cada empresa e validar a propriedade do número antes de chamar `/groups`.
   - Interromper com uma mensagem específica se houver divergência entre empresa, WABA, token ou número.

3. **Tratar elegibilidade real da Meta**
   - Se o conjunto estiver correto e a Meta continuar retornando `#131215`, mostrar no app que o número específico foi recusado pela Meta, sem repetir automaticamente a operação.
   - Exibir os dados não secretos necessários para abertura de chamado: empresa, final do número, `phone_number_id`, WABA, versão da API, código e identificador de rastreamento da Meta.

4. **Validar com efeito real controlado**
   - Executar primeiro uma criação real em apenas uma empresa, após autorização explícita do número/empresa de teste.
   - Confirmar retorno de `group_id` e link de convite, gravação no inbox e ausência de duplicidade.
   - Só depois repetir na segunda empresa e testar o fluxo pela interface autenticada.

5. **Webhooks de grupos**
   - Verificar a assinatura dos quatro eventos: `group_lifecycle_update`, `group_participants_update`, `group_settings_update` e `group_status_update`.
   - Confirmar que cada evento atualiza somente o inbox da empresa dona do respectivo número.

## Critério de conclusão
A correção só será considerada concluída quando um grupo real for criado pela Meta em cada empresa, aparecer uma única vez no inbox correto, fornecer link de convite e receber as atualizações dos webhooks sem cruzamento de dados.
