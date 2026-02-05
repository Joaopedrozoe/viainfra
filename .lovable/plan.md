
# Revisao: Comportamento de Scroll nas Conversas

## Problema Identificado

Ao sair de uma conversa e retornar, a barra de rolagem volta para o inicio (topo), perdendo a posicao anterior do usuario. Isso causa uma experiencia frustrante, especialmente em conversas longas.

---

## Diagnostico Tecnico

### Analise do ChatWindow.tsx

O componente `ChatWindow` atualmente:

1. **Linha 68-76**: Quando `conversationId` muda, reseta todos os estados e chama `loadInitialMessages()`
2. **Linha 168-179**: Apos carregar mensagens, faz scroll automatico para o final via `messagesEndRef.current?.scrollIntoView({ behavior: "auto" })`

O problema ocorre porque:
- Quando o usuario **sai** da conversa (navega para outra), o componente e desmontado
- Quando **retorna**, o componente e remontado do zero
- `loadInitialMessages()` carrega as ultimas 50 mensagens
- O efeito na linha 168 faz scroll para o final apos carregar

Isso e correto para uma **nova conversa** (mostrar mensagens mais recentes), mas nao preserva a posicao quando o usuario ja estava navegando pela conversa.

### Fluxo Atual

```text
Usuario sai da conversa A → ChatWindow desmonta → Estado perdido
Usuario volta para conversa A → ChatWindow remonta → loadInitialMessages() → Scroll para final
```

### Problema Secundario - InternalChatWindow

O `InternalChatWindow.tsx` usa `ScrollArea` do Radix mas tenta usar `scrollRef.current.scrollTop` diretamente no Root do componente. Isso pode nao funcionar corretamente porque o viewport interno do ScrollArea e um elemento separado.

---

## Solucao Proposta

### 1. Preservar Posicao de Scroll por Conversa

Implementar um cache de posicao de scroll por `conversationId`:

**Arquivo**: `src/components/app/ChatWindow.tsx`

Adicionar um Map ou objeto para guardar a posicao de scroll de cada conversa:

```typescript
// No topo do arquivo (fora do componente)
const scrollPositionsCache = new Map<string, number>();
```

Salvar posicao ao sair:

```typescript
// No useEffect de cleanup (quando conversationId muda ou componente desmonta)
useEffect(() => {
  return () => {
    // Salvar posicao atual antes de desmontar
    if (conversationId && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Salvar distancia do FINAL (mais confiavel que do topo)
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      scrollPositionsCache.set(conversationId, distanceFromBottom);
    }
  };
}, [conversationId]);
```

Restaurar posicao ao retornar:

```typescript
// Modificar o efeito de scroll apos carregar mensagens (linhas 168-179)
useEffect(() => {
  if (isLoadingHistoryRef.current) return;
  
  const container = messagesContainerRef.current;
  if (!container) return;
  
  // Verificar se temos posicao salva para esta conversa
  const savedDistance = scrollPositionsCache.get(conversationId || '');
  
  if (savedDistance !== undefined && savedDistance > 50) {
    // Restaurar posicao salva (distancia do final)
    requestAnimationFrame(() => {
      const targetScroll = container.scrollHeight - container.clientHeight - savedDistance;
      container.scrollTop = Math.max(0, targetScroll);
    });
    // Limpar cache apos usar
    scrollPositionsCache.delete(conversationId || '');
  } else {
    // Comportamento padrao: scroll para o final
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    });
  }
}, [messages.length, conversationId]);
```

### 2. Corrigir ScrollArea no InternalChatWindow

**Arquivo**: `src/components/app/InternalChatWindow.tsx`

O `ScrollArea` do Radix tem um viewport interno. Para acessar o scroll corretamente:

```typescript
// Linha 94 - Adicionar ref ao Viewport interno
<ScrollArea className="flex-1 p-4">
  <div ref={scrollRef} className="space-y-4">
    {/* messages */}
  </div>
</ScrollArea>

// E modificar o efeito (linhas 29-33):
useEffect(() => {
  // Scroll para o final usando scrollIntoView em vez de scrollTop
  scrollRef.current?.lastElementChild?.scrollIntoView({ behavior: "auto" });
}, [conversationMessages]);
```

### 3. Padronizar Comportamento em Toda a Plataforma

| Componente | Comportamento | Metodo de Scroll |
|------------|---------------|------------------|
| ChatWindow | Preserva posicao ao retornar | Cache de posicao + `scrollIntoView` |
| ConversationList | Preserva posicao de lista | `overflow-y-auto` nativo |
| InternalChatWindow | Scroll para final em novas mensagens | `scrollIntoView` |
| StatusList | Scroll simples | `overflow-y-auto` nativo |
| Modais/Dialogs | Scroll interno limitado | `ScrollArea` com `max-h` |

### 4. Boas Praticas Implementadas

| Pratica | Implementacao |
|---------|---------------|
| Scroll suave vs instantaneo | `behavior: "auto"` para carga, `"smooth"` para interacoes |
| Preservar posicao ao carregar historico | `previousScrollHeightRef` (ja existe) |
| Preservar posicao ao navegar | `scrollPositionsCache` (novo) |
| Evitar pulos visuais | `requestAnimationFrame` antes de scroll |
| Limpar cache quando necessario | Remover entrada apos restaurar |

---

## Arquivos a Serem Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/app/ChatWindow.tsx` | Adicionar cache de posicao de scroll |
| `src/components/app/InternalChatWindow.tsx` | Corrigir referencia do scroll |

---

## Codigo Detalhado

### ChatWindow.tsx - Alteracoes

**Adicionar no topo (apos imports, antes do componente):**

```typescript
// Cache de posicao de scroll por conversa (distancia do final)
const scrollPositionsCache = new Map<string, number>();
```

**Adicionar novo useEffect para salvar posicao:**

```typescript
// Salvar posicao do scroll quando sair da conversa
useEffect(() => {
  const container = messagesContainerRef.current;
  const currentConvId = conversationId;
  
  return () => {
    if (currentConvId && container) {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      // So salvar se nao estiver no final (mais de 100px do fim)
      if (distanceFromBottom > 100) {
        scrollPositionsCache.set(currentConvId, distanceFromBottom);
      } else {
        scrollPositionsCache.delete(currentConvId);
      }
    }
  };
}, [conversationId]);
```

**Modificar useEffect de scroll (linhas 168-179):**

```typescript
// Scroll para o final quando novas mensagens chegam (com preservacao de posicao)
useEffect(() => {
  if (isLoadingHistoryRef.current) return;
  
  const container = messagesContainerRef.current;
  if (!container) return;
  
  // Verificar se temos posicao salva para esta conversa
  const savedDistance = scrollPositionsCache.get(conversationId || '');
  
  if (savedDistance !== undefined) {
    // Restaurar posicao salva (distancia do final)
    requestAnimationFrame(() => {
      const targetScroll = container.scrollHeight - container.clientHeight - savedDistance;
      container.scrollTop = Math.max(0, targetScroll);
    });
    // Limpar cache apos usar (uma vez so)
    scrollPositionsCache.delete(conversationId || '');
  } else {
    // Comportamento padrao: scroll para o final
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    });
  }
}, [messages.length, conversationId]);
```

### InternalChatWindow.tsx - Alteracoes

**Linha 21**: Mudar referencia:

```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);
```

**Linhas 29-33**: Modificar efeito de scroll:

```typescript
useEffect(() => {
  // Scroll para o final quando novas mensagens chegam
  messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
}, [conversationMessages]);
```

**Linhas 94-137**: Adicionar elemento de ancora:

```typescript
<ScrollArea className="flex-1 p-4">
  <div className="space-y-4">
    {conversationMessages.map((message: InternalMessage) => {
      // ... codigo existente ...
    })}
    <div ref={messagesEndRef} />
  </div>
</ScrollArea>
```

**Remover**: `ref={scrollRef}` do ScrollArea (linha 94 atual)

---

## Comportamento Esperado Apos Implementacao

| Cenario | Resultado |
|---------|-----------|
| Abrir conversa pela primeira vez | Scroll para o final (mensagens recentes) |
| Navegar pelo historico e sair | Posicao salva no cache |
| Retornar a mesma conversa | Posicao restaurada |
| Fechar app e reabrir | Scroll para final (cache em memoria) |
| Receber nova mensagem | Scroll para final (se estava no final) |
| Carregar historico antigo | Posicao preservada (ja funciona) |

---

## Limites do Cache

- Cache em memoria (limpa ao recarregar pagina) - comportamento esperado
- Maximo de ~100 conversas no cache antes de precisar limpeza
- Posicoes muito proximas do final (< 100px) nao sao salvas

---

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Cache cresce demais | Limite implicito pelo uso (usuario nao navega 1000 conversas) |
| Posicao invalida apos novas mensagens | Calcular por distancia do final, nao do topo |
| Scroll visual errado | `requestAnimationFrame` garante calculo apos render |
