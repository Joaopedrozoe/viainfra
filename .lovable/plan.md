# Restabelecer os fluxos WhatsApp das duas empresas

## Objetivo
Restabelecer o fluxo real no WhatsApp e no inbox para VIAINFRA e VIALOGISTIC, com isolamento rígido entre empresas, uma única resposta por evento e os nomes canônicos **Sandra Romano** (RH) e **André Rocha** (Financeiro), sem alterar conversas que já estão sob atendimento humano.

## Diagnóstico confirmado
- Os dois bots publicados existem e têm fluxos equivalentes, mas o fluxo salvo possui somente 2 conexões de menu enquanto exibe 4 opções; parte do comportamento depende de nós virtuais mantidos apenas no processador do webhook.
- Eventos sem `phone_number_id` são aceitos pelos dois webhooks. Isso permite que um evento Evolution seja processado no endpoint da empresa errada se a URL/instância chegar incorreta.
- A escolha do bot é inferida pelo texto do nome da instância e usa `limit(1)`, em vez de validar de forma única a empresa da conversa, a instância e o bot esperado.
- O bloqueio contra duplicidade é uma leitura seguida de atualização, portanto não é atômico. As mensagens do bot também não recebem uma chave idempotente; o índice existente protege apenas mensagens com `request_id`.
- Há duplicidade real recente no histórico, inclusive duas boas-vindas da VIALOGISTIC separadas por milissegundos.
- O processador atual contém os nomes corretos: RH → Sandra Romano e Financeiro → André Rocha. O histórico recente também confirma respostas corretas com esses nomes.
- As instâncias abertas no banco são `VIAINFRA` e `VIALOGISTIC`, enquanto conversas recentes carregam `VIAINFRAOFICIAL`/`VIALOGISTICOFICIAL`; a resolução precisa tratar o identificador Meta como autoridade e não depender de correspondência textual frouxa.
- O frontend filtra a lista por `company_id`, mas a tela da conversa carrega apenas pelo ID. Ela deve também rejeitar uma conversa que não pertença à empresa ativa.

## Implementação
1. **Centralizar o roteamento canônico**
   - Criar uma configuração compartilhada e explícita para cada empresa: `company_id`, endpoint, instâncias permitidas, `phone_number_id`, WABA e bot publicado esperado.
   - Remover decisões por “default”, regex ampla ou fallback para a outra empresa.
   - Para payload Meta, exigir o `phone_number_id` correto; para payload Evolution, exigir instância permitida e vinculada à mesma empresa.

2. **Unificar o processamento do bot**
   - Manter um único processador compartilhado pelos dois webhooks, parametrizado pela configuração canônica da empresa.
   - Selecionar exatamente o bot publicado da empresa esperada e falhar de forma segura se houver zero ou mais de um candidato.
   - Normalizar entradas de menu (`1`, `2`, emojis/rótulos e texto equivalente) sem transferir imediatamente uma saudação ou frase livre; reiniciar no menu quando o estado estiver ausente/incompatível.
   - Preservar conversas com `agent_takeover`, `pending`, `resolved` ou bot desativado.

3. **Eliminar duplicidade na origem**
   - Gerar uma chave idempotente por evento recebido (`message_id` externo + empresa + etapa do bot).
   - Reservar o processamento de forma atômica no banco antes de produzir resposta.
   - Gravar a resposta e o novo estado uma única vez; somente enviar ao WhatsApp após a reserva/gravação bem-sucedida.
   - Não usar conteúdo ou intervalo de tempo como único critério, para não bloquear respostas legítimas repetidas.

4. **Blindar envio e inbox no frontend/backend**
   - Validar no backend que conversa, contato, empresa, instância e credencial pertencem ao mesmo canal antes de mensagens comuns, mídias ou templates.
   - No frontend, validar `conversation.company_id` contra a empresa ativa antes de carregar/enviar e limpar a conversa selecionada ao trocar de empresa.
   - Deduplicar atualizações otimistas/realtime pelo ID definitivo, sem esconder mensagens distintas.

5. **Nomes canônicos**
   - Centralizar o mapa de setores e remover ocorrências funcionais de Flávia/Eliane nos fluxos e processadores.
   - Garantir exatamente “Sandra Romano” e “André Rocha”, sem substituições recursivas como “Rocha Rocha”.

6. **Compatibilidade e recuperação segura**
   - Não apagar históricos nem reativar o bot em conversas já transferidas a humanos.
   - Corrigir somente estados técnicos quebrados comprovados em conversas de teste/fluxo ativo.
   - Manter VIALOGISTIC funcional durante a implantação, com mudanças isoladas e reversíveis.

## Validação obrigatória antes de concluir
- Testes automatizados do processador compartilhado para as duas empresas: saudação, opções 1–4, escolha dos 5 setores, `0`, entrada inválida e retomada de estado.
- Testes de isolamento: payload/instância/`phone_number_id` cruzado deve ser rejeitado sem criar conversa, mensagem ou envio.
- Teste de idempotência: repetir o mesmo webhook simultaneamente deve produzir exatamente uma mensagem no banco e um único envio externo.
- Testes diretos das Edge Functions e inspeção dos logs após publicação.
- Teste real controlado, um por empresa, confirmando no banco e inbox: empresa correta, número remetente correto, sequência sem duplicidade, Sandra Romano no RH e André Rocha no Financeiro.
- Teste do frontend alternando VIAINFRA/VIALOGISTIC para confirmar que conversa, realtime e envio não atravessam empresas.

## Detalhes técnicos
- Alterações previstas: webhooks das duas empresas, processador compartilhado, funções de envio/template, validação da conversa no inbox e uma migração pequena para idempotência atômica.
- A migração terá acesso restrito ao `service_role`; não exporá dados nem ampliará permissões do frontend.
- A publicação será feita por função e validada por etapa; se um teste de isolamento ou idempotência falhar, a etapa seguinte não prossegue.
