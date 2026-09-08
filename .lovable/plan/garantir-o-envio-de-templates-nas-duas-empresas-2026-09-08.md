# Garantir o envio de templates nas duas empresas

## Objetivo
Confirmar e estabilizar o envio de templates da VIAINFRA e da VIALOGISTIC após a regularização do pagamento, mantendo cada disparo independente dos erros anteriores e refletindo no inbox o status real da Meta.

## Estado confirmado
- A VIALOGISTIC realizou um novo disparo às 13:02, pelo número `+55 11 91875-2320`, e a mensagem já chegou a `delivered`.
- Os últimos disparos consultados da VIAINFRA, às 13:00, ainda receberam da Meta o erro `131042` de pagamento; eles aconteceram antes da confirmação atual e devem permanecer como histórico desses envios específicos.
- O diagnóstico atual da VIAINFRA mostra WABA ativa, empresa verificada, número `+55 11 97074-8166` conectado e qualidade verde. Isso confirma a conta operacional, mas ainda falta um envio posterior à regularização para comprovar a entrega.
- Cada tentativa recebe um `wamid` próprio e é gravada em uma nova mensagem. Os webhooks localizam e atualizam somente esse `wamid`, filtrado pela empresa correspondente; portanto, um erro antigo não deve ser reaproveitado por um disparo novo.

## Execução em etapas

### 1. Validar sem alterar o histórico
- Conferir novamente os templates aprovados e o vínculo conversa → empresa → WABA → número remetente para as duas empresas.
- Não apagar nem converter os erros antigos: eles representam corretamente tentativas que falharam naquele momento.
- Fazer um disparo controlado da VIAINFRA somente após sua autorização específica para o destino de teste e acompanhar o novo `wamid` até `sent`, `delivered`, `read` ou erro conclusivo.
- Como a VIALOGISTIC já atingiu `delivered` após a regularização, repetir o disparo nela apenas se você autorizar um segundo teste real.

### 2. Corrigir somente se a validação revelar falha
- Se a VIAINFRA ainda retornar `131042`, registrar o retorno integral e separar claramente uma pendência ainda mantida pela Meta de uma falha do app; não mascarar como sucesso.
- Se o envio for aceito mas o inbox ficar no erro anterior, ajustar a associação visual para que cada nova tentativa use exclusivamente seu próprio `wamid` e comece em `pending`, sem herdar erro ou status de outra mensagem.
- Impedir regressão de status: callbacks atrasados não poderão rebaixar `delivered/read` para `sent/pending`.
- Manter o isolamento rígido: VIAINFRA usa somente sua WABA/número e VIALOGISTIC somente os seus.
- Corrigir o caminho secundário de confirmações da Evolution, que hoje procura a mensagem globalmente pelo identificador: a busca também deverá exigir a empresa do endpoint antes de atualizar status, edição ou exclusão.

### 3. Validar antes de concluir
- Confirmar no banco uma única mensagem para cada novo `wamid`, na conversa e empresa corretas.
- Confirmar nos logs o número remetente correto e a sequência real de status.
- Conferir no navegador que o novo disparo não fica preso no erro histórico e que a mensagem antiga continua identificada como falha antiga.
- Parar após cada empresa para sua validação antes de seguir para a próxima etapa.

## Critério de aceite
- VIALOGISTIC permanece funcional com status real de entrega.
- VIAINFRA realiza um novo envio após a regularização e chega a `delivered/read`; se a Meta ainda rejeitar, o inbox mostra o novo erro oficial sem reutilizar o erro anterior.
- Nenhum disparo duplicado, mistura entre empresas ou falso sucesso.

## Segurança operacional
Nenhum disparo real será feito sem você indicar o destino de teste e autorizar essa etapa. Nenhuma alteração será aplicada antes da aprovação explícita exigida: `Lovable tool use: Approved`.
