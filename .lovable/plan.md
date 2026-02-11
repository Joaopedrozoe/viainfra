

## Correções: Barra de Rolagem Instável + Reply/Menção no WhatsApp

### Problema 1: Barra de Rolagem Instável ao Carregar Histórico

**Causa raiz identificada:** Dois bugs no gerenciamento de scroll em `ChatWindow.tsx`:

1. **Posição do scroll não é salva antes do carregamento.** Quando o usuário está a ~80px do topo e dispara o carregamento de histórico, o código salva apenas o `scrollHeight` do container (linha 230). Depois que as mensagens antigas são inseridas, o código faz `container.scrollTop = scrollDiff` (linha 242). Porém isso assume que o scrollTop era 0. O correto seria: `scrollTop = scrollDiff + scrollTopAnterior`. Sem isso, a barra "pula" para uma posição incorreta.

2. **Classe CSS `scroll-smooth` no container (linha 1059).** Essa classe aplica `scroll-behavior: smooth` a TODAS as mudanças de scrollTop, incluindo a restauração programática após carregar histórico. Isso causa um efeito visual de "deslizamento" inesperado quando deveria ser instantâneo.

3. **Race condition entre dois useEffects.** O efeito da linha 192 (auto-scroll para o fim) e o da linha 236 (restaurar posição após histórico) compartilham a dependência `messages`. Se o flag `isLoadingHistoryRef` for resetado antes do próximo ciclo, o efeito de auto-scroll pode disparar indevidamente.

**Correções:**

- **Salvar `scrollTop` atual** em `handleScroll` junto com `scrollHeight`, e usar ambos na restauração: `container.scrollTop = scrollDiff + savedScrollTop`
- **Remover `scroll-smooth` do container** de mensagens (linha 1059) -- o scroll suave é desnecessário e causa problemas na restauração de posição
- **Usar `requestAnimationFrame`** na restauração para garantir que o DOM já foi pintado antes de ajustar o scrollTop

---

### Problema 2: Reply/Menção -- Garantir que Funcione no WhatsApp Oficial

O código de reply está **estruturalmente correto**: a Edge Function `send-whatsapp-message` monta o objeto `quotedData` com `key.remoteJid`, `key.fromMe` e `key.id` no formato Baileys/Evolution API (linhas 285-292). Porém há um ponto fraco:

- Se a mensagem não tem `whatsappMessageId` (campo unificado de `metadata.whatsappMessageId || metadata.external_id`), o reply é enviado como mensagem normal sem citação. O atendente não recebe feedback visual claro de que a citação não será refletida no WhatsApp.

**Correção:** Adicionar um indicador visual sutil (nao um toast bloqueante) quando o reply for a uma mensagem sem `whatsappMessageId`, informando que a citação aparecerá apenas no inbox, não no WhatsApp. Isso será um pequeno texto no bloco de reply, não um toast.

---

### Arquivos modificados

**`src/components/app/ChatWindow.tsx`:**

1. No `handleScroll` (linha 221-233):
   - Salvar `container.scrollTop` em um novo ref (`previousScrollTopRef`) além do `scrollHeight`

2. No useEffect de restauração (linha 236-248):
   - Usar `container.scrollTop = scrollDiff + previousScrollTopRef.current` em vez de apenas `scrollDiff`
   - Envolver em `requestAnimationFrame` para timing correto
   - Resetar `previousScrollTopRef` após uso

3. No container de mensagens (linha 1059):
   - Remover a classe `scroll-smooth` do className

4. No `handleReplyMessage` (linha 820-832):
   - Se a mensagem não tem `whatsappMessageId`, marcar o `replyToMessage` com um flag visual para que o `ChatInput` possa mostrar "(citação local)" no bloco de reply

**`src/components/app/chat/ChatInput.tsx`** (ajuste menor):
   - Se o `replyToMessage` não tem `whatsappMessageId`, mostrar um texto pequeno "(somente no inbox)" abaixo da citação

---

### Resumo tecnico das mudancas

```text
ChatWindow.tsx:
  L25:  + const previousScrollTopRef = useRef(0);
  L229: + previousScrollTopRef.current = container.scrollTop;
  L241: - container.scrollTop = scrollDiff;
  L241: + requestAnimationFrame(() => {
            container.scrollTop = scrollDiff + previousScrollTopRef.current;
            previousScrollTopRef.current = 0;
          });
  L1059: - className="... scroll-smooth"
  L1059: + className="..." (sem scroll-smooth)

ChatInput.tsx:
  - Indicador visual quando reply nao tem whatsappMessageId
```

### Resultado esperado

- Ao rolar para cima e carregar mensagens antigas, a barra permanece na posição exata onde o usuario estava, sem pulos ou animacoes indesejadas
- Reply/mencao continua funcionando normalmente no WhatsApp oficial quando a mensagem tem ID valido
- Feedback visual claro quando a citacao nao sera refletida no WhatsApp (sem bloquear o envio)

