# Mudo nas ligações + mapa da localização recebida

Duas melhorias no inbox, valendo igual para Viainfra e Vialogistic.

## 1. Mudo nas ligações

Hoje o botão de mudo aparece na chamada em curso, mas fica escondido em outras etapas e não dá nenhum sinal claro de que o microfone está desligado.

O que muda:
- Botão de mudo disponível em toda a chamada (recebida, chamando e em curso), tanto no celular quanto no computador.
- Silenciamento aplicado ao microfone real e reaplicado assim que o áudio conecta, para que o estado escolhido antes de atender continue valendo.
- Aviso visual claro: botão destacado e a frase "Microfone desligado" na janela da chamada enquanto estiver no mudo.
- O mudo é reiniciado ao começar uma nova chamada, para ninguém falar no vazio por engano.

## 2. Localização recebida com mapa na mensagem

Hoje a localização enviada pelo contato aparece como texto/endereço ou um bloco de mapa que muitas vezes não carrega.

O que muda:
- A mensagem passa a mostrar um minimapa bonito, com o pino no ponto exato enviado pelo contato, no estilo do próprio WhatsApp.
- Abaixo do mapa: nome do local e endereço (quando o WhatsApp enviar), ou as coordenadas.
- Toque/clique no mapa abre o local no aplicativo de mapas do aparelho.
- Base de mapa livre (OpenStreetMap), sem cadastro, sem chave e sem custo.
- Se o mapa não puder carregar (sem internet, bloqueio de rede), aparece um bloco discreto com o pino, o endereço e o botão de abrir no mapa — nunca uma área quebrada.
- Localização ao vivo continua sendo exibida como o último ponto recebido, com o mesmo mapa.

Envio de localização ao vivo pela conexão oficial atual continua indisponível — isso é limite da API da Meta, não do app.

## Detalhes técnicos

- `src/lib/whatsapp-call-webrtc.ts`: guardar o estado de mudo na sessão e reaplicar em `createOffer`/`createAnswer` e ao adicionar as faixas de áudio.
- `src/components/app/calls/ActiveCallDialog.tsx` e `IncomingCallDialog.tsx`: mostrar o botão de mudo em todas as fases (exceto `ended`), rótulo/aria-label correto e indicador textual de mudo; resetar o estado ao abrir.
- `src/components/app/chat/MessageItem.tsx`: substituir o `LocationAttachment` baseado em `<iframe>` do OpenStreetMap por um minimapa composto por tiles PNG de `tile.openstreetmap.org`, calculados por lat/lng (zoom ~16, grade de tiles), com pino sobreposto em SVG, `loading="lazy"` e fallback de erro por tile. Nada de chaves de API nem do `staticmap` do Google (a URL com chave atual é removida).
- Sem mudanças de banco, de webhook ou de edge function: os campos `latitude`, `longitude`, `locationName` e `locationAddress` já chegam ao chat pelo `useInfiniteMessages`.

## Validação

- Typecheck do projeto.
- Conferência visual do minimapa com coordenadas reais em ambiente local.
- Nenhuma mensagem real de WhatsApp será enviada e nenhuma ligação real será iniciada nos testes.
