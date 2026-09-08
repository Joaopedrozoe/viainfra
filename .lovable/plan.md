# Tentar recuperar um vídeo de dezembro (Yago M Sam — Viainfra)

## O que o banco mostra hoje

Conversa **Yago M Sam — 551120854990** (Viainfra), aberta em 17/12/2025:

- 11 mensagens de vídeo entre 29 e 30/12/2025, algumas com legenda ("Ideal para o eixo dianteiro linha Pirelli Prometeon...", "⚠️ATENÇÃO", "Bom dia um abraço.").
- Nessas 11 mensagens só existe a marcação "[Vídeo]", a legenda e o identificador da mensagem no WhatsApp. Não há arquivo, link, cópia embutida, nem chave de mídia (verificado: 0 de 11 têm chave ou caminho de mídia).
- No armazenamento do sistema, essa conversa tem apenas fotos e áudios; o vídeo mais antigo dela é de fevereiro de 2026.

Existem 1.058 vídeos guardados no sistema, incluindo alguns de dezembro de 2025 — mas todos de outras conversas. Nenhum é dessa.

Conclusão: o arquivo não está no nosso banco. A única chance real é pedir a mídia de volta ao WhatsApp usando o identificador da mensagem guardado.

## Plano: teste único de recuperação

1. **Escolher a mensagem de teste** — a de 30/12/2025 16:30 ("Ideal para o eixo dianteiro linha Pirelli Prometeon modelo Itineris steer"), que tem identificador salvo.
2. **Pedir a mídia ao WhatsApp da Viainfra** pelo identificador da mensagem, sem enviar nada a ninguém e sem alterar a conversa. Só leitura.
3. **Se voltar o arquivo**: guardar o .mp4 no armazenamento, ligar à mensagem original e te mostrar o vídeo tocando na conversa.
4. **Se não voltar**: te informar exatamente a resposta recebida. Nesse caso, os outros 10 seguem o mesmo destino e a recuperação depende do celular/backup do WhatsApp de quem enviou.
5. **Só depois da sua validação** desse teste, repetir para os 10 vídeos restantes.

## Detalhes técnicos

- Mensagem de teste: `5af27b98-2c4a-4cfb-a30b-6bab132729a8`, identificador WhatsApp `A5F252F0C40F99C52937BFBF11A01197`, conversa `61f82363-6d0b-496e-ba6d-8dc39b60a570`.
- Recuperação via instância Viainfra, buscando a mensagem pelo id e solicitando o download em base64; nenhum envio de mensagem.
- Registros importados carregam `importedFromLid: true` e não têm `mediaKey`/`directPath`, por isso o download depende do servidor ainda ter a mídia — mídia antiga costuma expirar.
- Se der certo, o arquivo vai para `chat-attachments/<conversa>/` e a mensagem recebe `attachment` com url e tipo, no mesmo formato dos vídeos que já funcionam.
- Nada é apagado nem sobrescrito; a mensagem original permanece.

## Prevenção (opcional, depois)

Ao importar históricos, tentar baixar a mídia na hora da importação, para não sobrar só a marcação "[Vídeo]".
