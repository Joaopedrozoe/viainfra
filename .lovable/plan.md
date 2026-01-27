
# Correção do Scroll ao Carregar Histórico de Mensagens

## Problema Identificado

Ao rolar para o topo da conversa para carregar mensagens antigas, a visualização retorna abruptamente para o final da conversa, forçando o usuário a rolar novamente para encontrar o histórico.

## Causa Raiz

Existe um **conflito entre dois efeitos** no componente ChatWindow:

### Efeito 1 - Scroll automático para novas mensagens (linhas 162-167)
```javascript
useEffect(() => {
  requestAnimationFrame(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });
}, [messages.length]);
```

### Efeito 2 - Restauração de posição após carregar histórico (linhas 183-193)
```javascript
useEffect(() => {
  // Tenta restaurar posição do scroll...
}, [messages, isLoadingMore]);
```

### Sequência de Eventos (Problema)
```text
Usuario rola para o topo
         |
         v
loadMoreMessages() é chamado
         |
         v
Mensagens antigas adicionadas ao início do array
         |
         v
messages.length AUMENTA
         |
         v
EFEITO 1 dispara: scrollIntoView para o FINAL
         |
         v
EFEITO 2 dispara: tenta restaurar posição (TARDE DEMAIS)
         |
         v
Usuario perde posição e vai para o final
```

## Solução Proposta

Adicionar uma **flag de controle** que indica quando estamos carregando histórico antigo, e **impedir o scroll automático** nesse cenário.

### Fase 1: Adicionar Flag de Controle

Criar uma ref para rastrear se o carregamento atual é de histórico antigo ou de nova mensagem.

```typescript
const isLoadingHistoryRef = useRef(false);
```

### Fase 2: Modificar handleScroll

Setar a flag antes de chamar loadMoreMessages:

```typescript
const handleScroll = useCallback(() => {
  const container = messagesContainerRef.current;
  if (!container || isLoadingMore || !hasMore) return;

  if (container.scrollTop < 100) {
    isLoadingHistoryRef.current = true; // Marcar que é histórico
    previousScrollHeightRef.current = container.scrollHeight;
    loadMoreMessages();
  }
}, [isLoadingMore, hasMore, loadMoreMessages]);
```

### Fase 3: Modificar Efeito de Scroll Automático

Verificar a flag antes de fazer scroll para o final:

```typescript
useEffect(() => {
  // NÃO fazer scroll automático se estiver carregando histórico
  if (isLoadingHistoryRef.current) {
    return;
  }
  
  requestAnimationFrame(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });
}, [messages.length]);
```

### Fase 4: Modificar Efeito de Restauração de Posição

Resetar a flag após restaurar a posição:

```typescript
useEffect(() => {
  const container = messagesContainerRef.current;
  if (container && previousScrollHeightRef.current > 0 && !isLoadingMore) {
    const newScrollHeight = container.scrollHeight;
    const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
    if (scrollDiff > 0) {
      container.scrollTop = scrollDiff;
    }
    previousScrollHeightRef.current = 0;
    isLoadingHistoryRef.current = false; // Resetar flag
  }
}, [messages, isLoadingMore]);
```

---

## Fluxo Corrigido

```text
Usuario rola para o topo
         |
         v
handleScroll: isLoadingHistoryRef = TRUE
         |
         v
loadMoreMessages() é chamado
         |
         v
Mensagens antigas adicionadas ao início do array
         |
         v
messages.length AUMENTA
         |
         v
EFEITO 1 verifica: isLoadingHistoryRef === true
         |
         v
EFEITO 1 retorna sem fazer nada (scroll preservado)
         |
         v
EFEITO 2 restaura posição do scroll
         |
         v
isLoadingHistoryRef = FALSE
         |
         v
Usuario permanece no topo onde estava
```

---

## Secao Tecnica

### Arquivo a Modificar

`src/components/app/ChatWindow.tsx`

### Alterações Detalhadas

| Linha Atual | Alteração |
|-------------|-----------|
| 37 | Adicionar `const isLoadingHistoryRef = useRef(false);` |
| 162-167 | Adicionar verificação de `isLoadingHistoryRef.current` |
| 175-178 | Setar `isLoadingHistoryRef.current = true` antes de loadMoreMessages |
| 191 | Adicionar `isLoadingHistoryRef.current = false` após restaurar scroll |

### Código Final dos Efeitos

**Efeito de Scroll Automático:**
```typescript
useEffect(() => {
  // Não fazer scroll automático se estiver carregando histórico antigo
  if (isLoadingHistoryRef.current) {
    return;
  }
  
  requestAnimationFrame(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });
}, [messages.length]);
```

**Handler de Scroll:**
```typescript
const handleScroll = useCallback(() => {
  const container = messagesContainerRef.current;
  if (!container || isLoadingMore || !hasMore) return;

  if (container.scrollTop < 100) {
    isLoadingHistoryRef.current = true;
    previousScrollHeightRef.current = container.scrollHeight;
    loadMoreMessages();
  }
}, [isLoadingMore, hasMore, loadMoreMessages]);
```

**Efeito de Restauração:**
```typescript
useEffect(() => {
  const container = messagesContainerRef.current;
  if (container && previousScrollHeightRef.current > 0 && !isLoadingMore) {
    const newScrollHeight = container.scrollHeight;
    const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
    if (scrollDiff > 0) {
      container.scrollTop = scrollDiff;
    }
    previousScrollHeightRef.current = 0;
    isLoadingHistoryRef.current = false;
  }
}, [messages, isLoadingMore]);
```

---

## Validação

Após implementação:

1. Abrir uma conversa com histórico extenso
2. Rolar até o topo para acionar carregamento de mensagens antigas
3. Verificar que a visualização permanece no topo
4. Confirmar que as mensagens antigas aparecem acima
5. Enviar uma nova mensagem e verificar que o scroll automático para o final ainda funciona

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Flag não resetada em caso de erro | O useEffect de restauração sempre reseta a flag ao final |
| Scroll automático não funciona para novas mensagens | A flag só é setada em handleScroll (carregamento de histórico) |
| Race condition residual | requestAnimationFrame é removido em favor de execução síncrona |
