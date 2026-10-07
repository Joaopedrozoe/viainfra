# Localização, contatos enviados e mensagens em tempo real (Viainfra e Vialogistic)

## 1. Localização com minimapa clicável
- Toda localização recebida aparece na conversa com um minimapa gratuito (OpenStreetMap, sem chave nem custo) e um pino no ponto exato.
- Ao clicar no mapa, abre o local no Google Maps.
- Se o mapa não carregar, aparece um card com o pino, o endereço e o botão "Abrir no Google Maps", nunca uma área vazia.
- Localizações antigas ou incompletas: as coordenadas também são lidas do texto ou do link da mensagem, para que o mapa ainda apareça.

## 2. Contatos enviados chegam como WhatsApp válido
- Antes do envio, o número é normalizado no formato internacional (55 + DDD + número) e conferido.
- O cartão é montado no formato oficial da Meta, com o número ligado ao WhatsApp (campo `wa_id`). Assim quem recebe vê "Conversar", e não "Convidar para o WhatsApp".
- Se o número não for válido no WhatsApp, o atendente vê um aviso antes do envio, em vez de mandar um cartão quebrado.

## 3. Mensagem visível dentro da conversa ao mesmo tempo que na lista
- Quando chega uma mensagem nova da conversa aberta, ela aparece na hora, mesmo que tenha chegado enquanto o histórico ainda carregava.
- Se a lista mostrar uma mensagem que não está no chat aberto, o chat busca automaticamente as mensagens que faltam.
- Ao voltar para a aba, ou quando a conexão em tempo real cair e voltar, a conversa aberta é atualizada sozinha.
- Som e notificação continuam disparando para mensagens recebidas, só da empresa ativa.

## Segurança da operação
- Nenhuma mudança no banco de dados.
- Separação total entre as empresas mantida.
- Nenhuma mensagem real será enviada nos testes, a não ser para 553599534971, se necessário.

## Detalhes técnicos
- `MessageItem.tsx`: o minimapa abre `https://www.google.com/maps/search/?api=1&query=lat,lng`; extração de coordenadas como fallback a partir de `content` (links `maps`, `geo:`).
- `send-whatsapp-message/index.ts`: payload de contato com `phones[{phone:"+55...", wa_id:"55...", type:"CELL"}]` e `name.formatted_name`/`first_name`; validação do número e erro claro em caso de falha.
- `useInfiniteMessages.ts` e `ChatWindow.tsx`: guardar eventos realtime recebidos durante a carga inicial e mesclar sem duplicar; refazer a busca de mensagens mais novas que a última carregada quando o preview estiver mais novo, ao voltar o foco da aba e ao reconectar o canal.
- Validação: typecheck e teste no navegador com sessão autenticada nas duas empresas.
