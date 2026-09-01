# Restabelecer o disparo de templates nas duas empresas

## Objetivo
Garantir que templates enviados no inbox da VIAINFRA e da VIALOGISTIC saiam exclusivamente pelo número correto, sejam efetivamente entregues e tenham o status real refletido na conversa, sem duplicidade nem impacto cruzado.

## Estado confirmado
- A função `send-whatsapp-template` recebeu disparos recentes das duas empresas e a Meta respondeu HTTP 200 com `message_status: accepted` e um `wamid` para cada envio.
- Os remetentes resolvidos nos logs estão separados: VIAINFRA `+55 11 97074-8166` e VIALOGISTIC `+55 11 91875-2320`.
- No banco, esses disparos foram gravados apenas como `whatsappStatus: sent`; não há confirmação de `delivered` nos registros consultados. Portanto, a falha precisa ser localizada entre o aceite da Meta, os callbacks de status e a entrega final — não será tratada como sucesso apenas pelo HTTP 200.

## Implementação
1. **Diagnóstico por `wamid`**
   - Rastrear os últimos envios de cada empresa nos callbacks Meta/Evolution.
   - Identificar status `delivered`, `read` ou `failed`, incluindo código e detalhe de erro da Meta.
   - Confirmar que cada callback chega ao webhook da mesma empresa que originou o envio.

2. **Isolamento canônico por empresa**
   - Validar `conversation.company_id` → empresa → WABA → `phone_number_id` antes de cada disparo.
   - Remover qualquer fallback que permita selecionar o primeiro número da WABA ou credencial/número fixo incompatível.
   - Falhar de forma explícita antes do envio se empresa, WABA, número remetente e token não formarem o par esperado.

3. **Correção do ciclo de status**
   - Fazer os dois webhooks processarem callbacks pelo `wamid` e atualizarem a mensagem existente, sem criar outra mensagem.
   - Persistir `accepted/sent`, `delivered`, `read` e `failed`, com erro real quando houver falha.
   - Evitar que um callback recebido no endpoint errado altere uma conversa da outra empresa.

4. **Disparo seguro e interface fiel**
   - Bloquear templates não aprovados para envio; mantê-los visíveis apenas como “Em análise”.
   - Impedir duplo clique/repetição do mesmo disparo enquanto a requisição estiver em andamento.
   - Exibir “aceito pela Meta” separadamente de “entregue”, e mostrar a causa real quando falhar.

5. **Validação antes de concluir**
   - Executar um envio controlado pela VIAINFRA e outro pela VIALOGISTIC para destinos de teste distintos.
   - Confirmar em cada caso: empresa da conversa, WABA, número remetente, `wamid`, uma única mensagem no banco e progressão até `delivered` ou erro Meta conclusivo.
   - Validar no navegador o seletor, o bloqueio de template em análise, o envio único e a atualização visual do status.
   - Não alterar o fluxo do bot nem dados históricos durante esta correção.

## Critério de aceite
A correção só será considerada concluída quando os dois testes isolados mostrarem envio pelo remetente correto e confirmação de entrega real (`delivered`/`read`) — ou, se a Meta rejeitar o destinatário, o erro oficial completo aparecer no inbox sem falso sucesso e sem afetar a outra empresa.
