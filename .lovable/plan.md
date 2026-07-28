## Diagnóstico (confirmado)

O erro `131009 – Parameter value is not valid / Missing session parameter` vem da própria Meta. A função `initiate-whatsapp-call` envia hoje apenas:

```json
{ "messaging_product": "whatsapp", "to": "553599654511", "action": "connect" }
```

A documentação da Calling API exige, para `action: "connect"` (chamada iniciada pela empresa), um objeto `session` com uma **oferta SDP WebRTC** gerada pelo dispositivo que vai falar — no nosso caso, o navegador do atendente. Sem isso a Meta rejeita com 400. Não é problema de token, número ou de a Calling API estar desabilitada.

## O que será construído

Uma chamada de voz real dentro do app: o navegador captura o microfone, gera a oferta SDP, a Meta devolve a resposta SDP via webhook, e o áudio flui pelo WebRTC (ICE/DTLS/SRTP, codec OPUS).

### 1. Camada WebRTC no frontend (novo)
Um serviço `src/lib/whatsapp-call-webrtc.ts` responsável por:
- pedir permissão de microfone (`getUserMedia`, áudio-only);
- criar o `RTCPeerConnection` com STUN público, gerar a oferta e **aguardar o ICE gathering completar** (a Meta exige SDP com candidatos, não trickle);
- expor métodos para aplicar a resposta SDP (`setRemoteDescription`) e encerrar a chamada;
- tocar o áudio remoto num elemento `<audio>` oculto.

### 2. Edge functions
- **`initiate-whatsapp-call`**: passa a receber `sdp` do cliente e enviar `session: { sdp_type: "offer", sdp }`. Validação: sem SDP, retorna erro claro em vez de chamar a Meta. Continua gravando na tabela `calls` com `wa_call_id`.
- **Nova `whatsapp-call-action`**: encaminha `pre_accept`, `accept`, `reject` e `terminate` para a Meta (necessário para desligar do lado do app e, no futuro, atender chamadas recebidas), atualizando o status em `calls`.
- **Webhooks (`evolution-webhook` e `evolution-webhook-vialogistic`)**: ao receber o evento `calls` com `status: accepted` e o `session.sdp` (answer) da Meta, gravar esse SDP em `calls.metadata` para o navegador aplicar. Também atualizar `connected`/`terminated`.

### 3. Sinalização de volta ao navegador
O navegador que iniciou a chamada assina via Supabase Realtime a linha da tabela `calls` (por `id`). Quando o webhook grava a answer SDP, o cliente aplica e o áudio conecta. Como `calls` já tem RLS por empresa, basta habilitar Realtime nessa tabela (migration).

### 4. Interface
- `DialPad.tsx` e o botão de ligar do `ChatHeader.tsx` passam a abrir uma **tela de chamada ativa** (novo `ActiveCallDialog.tsx`): estado (chamando / tocando / em chamada), cronômetro, mudo e desligar.
- Mensagens de erro amigáveis: microfone bloqueado, permissão de ligação ausente, país não suportado.

### 5. Permissão de ligação (pré-requisito da Meta)
Chamadas iniciadas pela empresa só são entregues se o usuário tiver concedido **call permission** nas últimas 24h/7 dias. Se a Meta responder com erro de permissão, o app enviará automaticamente o pedido de permissão via mensagem interativa e avisará o atendente — evitando o loop de erro atual.

## Detalhes técnicos

- SDP deve ser RFC 8866, áudio OPUS, com candidatos ICE já coletados (esperar `iceGatheringState === "complete"` ou timeout de ~3s).
- A página precisa rodar em HTTPS (preview e domínio próprio já são).
- Nenhum secret novo: usa `META_ACCESS_TOKEN_VIAINFRA` / `META_ACCESS_TOKEN_VIALOGISTIC` já configurados.
- Migration única: `ALTER PUBLICATION supabase_realtime ADD TABLE public.calls` + `REPLICA IDENTITY FULL`.
- Chamadas recebidas (usuário liga para a empresa) ficam fora deste escopo; a base criada já permite adicioná-las depois.

## Limitação honesta

Chamadas iniciadas pela empresa estão disponíveis apenas em países habilitados pela Meta e dependem da permissão do usuário. Mesmo com tudo correto no código, a Meta pode recusar se a conta não atender aos requisitos (limite diário de 2.000 destinatários únicos, app inscrito no campo `calls`). Se isso ocorrer, o erro passará a ser exibido de forma explícita em vez do 400 genérico.
