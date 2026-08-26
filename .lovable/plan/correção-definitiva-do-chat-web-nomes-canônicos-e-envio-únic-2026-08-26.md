# Correção definitiva do chat web: nomes canônicos e envio único

## Diagnóstico confirmado

- A seleção de setor gera hoje **duas mensagens automáticas diferentes com o mesmo significado**: uma saudação gravada como `agent` dentro do bloco de transferência e outra resposta gravada como `bot` ao final da função. Isso explica as duas bolhas consecutivas vistas nas imagens.
- O sanitizador do banco **não é idempotente**: a expressão que procura “atendido por André” também encontra “atendido por André Rocha”, acrescentando outro “Rocha” a cada nova atualização. O banco já contém ocorrências recentes como “André Rocha Rocha” e “André Rocha Rocha Rocha”.
- O widget exibe imediatamente a resposta HTTP sem ID, enquanto o polling recupera a saudação persistida. Assim, não existe uma chave comum capaz de impedir a duplicidade entre resposta direta, persistência e polling.
- Os fluxos ativos armazenados em `bots.flows` não contêm os nomes legados; os mapeamentos atuais do código já apontam Financeiro para André Rocha e RH para Sandra Romano. O erro restante está na combinação de resposta duplicada, sanitização não idempotente e caminhos de renderização distintos.

## Implementação

1. **Tornar a função `chat-bot` a única fonte de verdade**
   - Manter um único mapa canônico de setor/atendente.
   - Na transferência, criar apenas **uma** mensagem automática, eliminando a saudação paralela gravada como `agent`.
   - Retornar ao widget o ID da mensagem persistida, em vez de apenas texto sem identidade.

2. **Adicionar idempotência real ao envio**
   - O widget criará um `requestId` por ação do usuário e bloqueará novos cliques/Enter enquanto a requisição estiver ativa.
   - A função validará e persistirá esse identificador na mensagem.
   - Uma restrição única no banco impedirá que retry, duplo clique, concorrência ou repetição da função grave duas respostas para a mesma ação.
   - Requisições repetidas retornarão a resposta já criada, sem reprocessar transferência, estado ou mensagem.

3. **Substituir a sanitização defeituosa por normalização idempotente**
   - Corrigir a função/trigger para converter apenas nomes legados ou “André” sem sobrenome.
   - Preservar “André Rocha” intacto e reduzir qualquer repetição existente de “Rocha” para uma única ocorrência.
   - Aplicar a mesma normalização no estado e metadados persistidos; remover os sanitizadores divergentes do widget depois que o servidor for a fonte canônica.

4. **Alinhar os dois clientes web**
   - Atualizar `widget-script.js` e `widget-embed.html` com o mesmo protocolo de `requestId`, uso do ID retornado e deduplicação por ID.
   - No carregamento/polling, registrar todos os IDs já renderizados, inclusive a resposta recebida diretamente, para ela não reaparecer.
   - Garantir que abrir/fechar o widget não recrie listeners, polling ou conversa.

5. **Corrigir os dados afetados sem apagar histórico legítimo**
   - Normalizar mensagens e metadados com “André Rocha Rocha…”, André sem sobrenome e nomes legados.
   - Remover somente o par automático redundante comprovadamente criado no mesmo evento de transferência, preservando mensagens humanas e demais registros.

## Validação obrigatória

- Executar chat web real nos dois widgets, em conversa nova e conversa retomada.
- Testar Financeiro e RH nas duas empresas.
- Testar clique único, duplo clique rápido, Enter repetido e retry da mesma requisição.
- Confirmar no navegador e no banco: uma única mensagem de transferência, André Rocha/Sandra Romano corretos, nenhum “Rocha Rocha”, nenhum nome legado e um único registro por `requestId`.
- Verificar o Inbox após polling/atualização da página para confirmar que a mensagem não reaparece em duplicidade.
