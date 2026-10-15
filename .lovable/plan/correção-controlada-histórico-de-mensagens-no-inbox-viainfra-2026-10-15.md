# Correção controlada — histórico de mensagens no Inbox (Viainfra e Vialogistic)

Escopo: só a tela da conversa. Sem mudanças no banco, nas regras de acesso, nas funções do servidor, nos webhooks, nas credenciais da Meta ou nas instâncias da Evolution. Nenhuma mensagem real será enviada.

## 1. O que está demonstrado e o que ainda é hipótese

Demonstrado ao ler o código:
- **Mensagens antigas podem ser puladas.** Para buscar a página anterior, o sistema pede as mensagens com horário menor que o da mensagem mais antiga já carregada. Se várias mensagens tiverem exatamente o mesmo horário (álbuns, mensagens do bot, importações), as que estiverem na divisa entre duas páginas são ignoradas sem aviso.
- **O carregamento pode parar antes do fim.** Se uma página voltar inteira com mensagens repetidas, o sistema entende que "não há mais histórico" e para de buscar.
- **Uma falha deixa a tela parecendo completa.** Quando uma busca falha, o erro só aparece no console. A tela não avisa e não oferece "tentar novamente".
- **Respostas atrasadas não são descartadas.** Se a atendente troca de conversa enquanto uma página ainda está carregando, a resposta que chegar depois é colocada na tela sem verificar se ainda pertence à conversa aberta.
- **A recuperação depois de uma queda é limitada.** Quando a conexão volta, o sistema busca só as últimas 30 mensagens. Se chegaram mais de 30 durante a queda, as do meio ficam faltando até a conversa ser reaberta.

Ainda é hipótese, não confirmada:
- Que algum desses pontos tenha causado exatamente a lacuna relatada no Reginaldo. As 306 mensagens dele estão salvas; vou verificar no teste da etapa 5 quantas têm horários iguais na divisa entre páginas.

## 2. Alterações por arquivo

**`src/hooks/useInfiniteMessages.ts`** (é aqui que fica quase toda a correção)
- Ordenação sempre por horário e depois pelo identificador da mensagem. A próxima página é buscada a partir desse par (horário + identificador), então nenhuma mensagem com horário igual fica de fora.
- "Não há mais histórico" só é marcado quando o banco devolver menos mensagens que o tamanho da página, nunca por causa de repetidas.
- Cada busca leva uma marca da conversa que estava aberta quando começou. Se a resposta chegar e a conversa aberta for outra, ela é descartada.
- Quando a conversa muda, a lista, o controle de repetidas e o ponto de paginação são limpos.
- Novo indicador de erro e uma função "tentar novamente" para a página que falhou.
- Recuperação depois de queda: busca tudo o que for mais novo que a última mensagem confirmada, de 50 em 50, com limite de 10 lotes (500 mensagens). Se passar desse limite, recarrega a conversa e preserva as mensagens que ainda estão sendo enviadas. Ela nunca apaga o que já está na tela e sempre reordena pelo mesmo critério.
- Proteção para não rodar duas recuperações ao mesmo tempo, porque hoje o retorno ao app, a volta da rede, a reconexão e o timer de 15 segundos podem disparar juntos.

**`src/components/app/ChatWindow.tsx`** (mudanças pequenas)
- Mostrar "Não foi possível carregar mensagens anteriores · Tentar novamente" quando a busca falhar.
- Mostrar "Início da conversa" somente quando o histórico realmente acabar.
- Manter a correção atual da posição da rolagem ao carregar mensagens antigas, garantindo que ela só aconteça na conversa certa.

**`src/hooks/useConversations.ts`**: não muda.

## 3. Como funcionam a paginação e a recuperação

```text
Abrir conversa   -> últimas 50 (mais recentes primeiro) -> exibe da mais antiga para a mais nova
Rolar para cima  -> 50 anteriores ao par (horário, identificador) mais antigo -> repete até acabar
Queda/retorno    -> mais novas que a última confirmada, de 50 em 50 (máx. 10 lotes) -> mescla sem repetir
Troca de conversa-> nova marca de conversa; respostas da conversa anterior são ignoradas
```

## 4. Separação entre Viainfra e Vialogistic
- Toda busca filtra pelo identificador exato da conversa, e as regras de acesso do banco já limitam o acesso à empresa de quem está logado. Isso continua igual.
- Nada é guardado no navegador por número de telefone. O mesmo número em empresas diferentes continua sendo tratado como conversas separadas.
- Trocar de empresa fecha a conversa aberta. A marca de conversa garante que nenhuma resposta antiga entre na tela da outra empresa.

## 5. Testes antes de liberar
- Testes automatizados da lógica de páginas e mesclagem, com dados simulados: 50, 100, 300 e 306 mensagens; blocos com horário idêntico na divisa entre páginas; respostas atrasadas depois de trocar de conversa; queda com 35 e com 600 mensagens novas. Cada teste confere que não há repetidas, que nada falta e que a ordem está correta. Vou acrescentar o Vitest só como ferramenta de teste; isso não muda o app.
- Leitura (sem gravar nada) da conversa do Reginaldo: percorrer as 306 mensagens com o mesmo critério de páginas e conferir que todas aparecem.
- No navegador, logado: abrir conversas longas nas duas empresas, rolar até o início, trocar de conversa rápido, alternar entre empresas e simular queda de rede. Nada é enviado.
- Conferir que continua igual: lista de conversas, áudios, anexos, prévias e status de entrega.
- Volume de consultas: no máximo 1 consulta por página rolada e 1 a 10 por recuperação, no lugar das recuperações repetidas que podem acontecer hoje.

## 6. Riscos e como desfazer
- Risco de a rolagem pular ao carregar mensagens antigas: reduzido mantendo a lógica atual de posição.
- Risco de uma recuperação longa depois de uma queda grande: limitada a 10 lotes, depois recarrega a conversa.
- Como desfazer: são só 2 arquivos da tela, sem mudança de dados. Basta restaurar a versão anterior pelo histórico do Lovable e publicar. Não há nada para reverter no banco.

## 7. Como liberar sem interromper os atendimentos
- As alterações ficam só no preview até você validar. Não vou publicar.
- Depois que você publicar, quem estiver atendendo recebe a versão nova ao recarregar a página. Nada é perdido, porque as mensagens vêm sempre do banco.

## Detalhes técnicos
- Cursor: `.or('created_at.lt.T,and(created_at.eq.T,id.lt.ID)')` com `.order('created_at',{ascending:false}).order('id',{ascending:false})`.
- Recuperação: `.or('created_at.gt.T,and(created_at.eq.T,id.gt.ID)')` em ordem crescente, com limite de 50 por lote.
- A lógica pura (`mergeMessages`, `buildCursor`) vai para um módulo pequeno e testável dentro do mesmo hook ou em `src/lib/message-pagination.ts`.
