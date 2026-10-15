# Correção de 6 alertas confirmados (sem impacto na operação)

Alerta "Viainfra sem bot ativo" descartado: o fluxo da Viainfra está publicado e ativo.

## 1. Bot se desligando sozinho no meio do atendimento
- Trocar a regra "3 respostas em 3 minutos" por detecção de loop real: só desligar quando o bot enviar a **mesma resposta repetida** (ex.: 4+ iguais em 2 minutos) ou mais de ~12 respostas em 3 minutos.
- Quando desligar, colocar a conversa como **pendente** na fila humana (como já acontece numa transferência), para ninguém ficar sem resposta.
- Aplicar igual nas duas empresas.

## 2. Nomes de clientes alterados (ex.: "Flávia")
- A correção automática de nomes passa a valer **só para mensagens do bot e do atendente**, nunca para mensagens do cliente.
- Mensagens já gravadas não serão alteradas.

## 3. Anexos de colegas/clientes não abrem quando o link é bloqueado
- Liberar a leitura pelo app, para usuários logados, dos arquivos das conversas, fotos de perfil e widget (os arquivos já são públicos). O envio e a exclusão continuam restritos a quem enviou.

## 4. Envio para grupos bloqueado antes de tentar
- A checagem de participantes volta a ser apenas informativa: a mensagem é sempre tentada, e o erro só aparece se a Meta/WhatsApp recusar de fato.

## 5. Legenda e anexos somem quando um envio falha
- O envio passa a informar se deu certo. Na primeira falha, o envio para, e a legenda e os anexos que ainda não saíram ficam na caixa de mensagem. Sem aviso repetido.

## 6. "Iniciar conversa" criando contato duplicado
- Ao iniciar pela página de Contatos ou pelo painel do contato, usar o **próprio contato clicado** e a conversa já existente dele.
- Na busca por número, considerar as variações com e sem "55" e com formatação, antes de criar um contato novo.

## Validação
- Testes automáticos para: regra de loop do bot, variações de número de telefone.
- Conferir no banco que nada foi alterado em mensagens antigas.
- Nenhuma mensagem real será enviada.

## Detalhes técnicos
- Webhooks `evolution-webhook` e `evolution-webhook-vialogistic` (bloco anti-loop em triggerBotResponse).
- Migração: trigger `trg_sanitize_message_agent_names` restrito a `sender_type in ('bot','agent')`; policy SELECT em storage.objects para authenticated nos buckets públicos do chat.
- `send-whatsapp-message`: remover retornos antecipados do bloco de participantes.
- `ChatWindow.handleSendMessage` retorna boolean; `ChatInput` interrompe e preserva fila.
- `useStartConversation`: aceitar `contactId` opcional e buscar telefones por variantes.
