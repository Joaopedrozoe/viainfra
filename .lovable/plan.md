
# Plano de Desenvolvimento ViaInfra

## Status de Implementação

### Revisão Visual Premium (FASE 1 - Concluída ✅)
- [x] Sidebar: Logo flutuante com fundo branco
- [x] Menu: Ícones maiores (h-5 w-5), indicador ativo com border-l
- [x] Perfil: Avatar maior (h-10), ring primária
- [x] ChatHeader: backdrop-blur, shadow-sm, tokens semânticos
- [x] MessageItem: bordas arredondadas premium, shadow-sm
- [x] ConversationItem: tokens semânticos, hover refinado
- [x] Dashboard: tokens semânticos, cards refinados
- [x] MetricsOverview: hover elevado, loading skeletons
- [x] EmptyState: novo componente reutilizável

### Otimização de Performance (FASE 1 - Concluída ✅)
- [x] Virtualização: ConversationList com @tanstack/react-virtual
- [x] Debounce: useDeferredValue para busca fluida
- [x] Handlers estáveis: useRef para handlers realtime
- [x] Pre-loading: rotas carregadas no hover do menu

---

# Plano de Revisao e Otimizacao de Performance da Interface (UI)

## Resumo Executivo

Este plano propoe otimizacoes abrangentes para elevar a responsividade, fluidez e percepcao de instantaneidade da plataforma ViaInfra, adequando-a a um ambiente corporativo de uso intensivo. As melhorias sao incrementais, seguras e nao alteram funcionalidades existentes.

---


## 1. Diagnostico Atual - Pontos de Gargalo Identificados

### 1.1 Renderizacoes e Re-renders

| Componente | Problema | Impacto |
|------------|----------|---------|
| `ConversationList` | `filteredConversations` recalcula em todo render, mesmo sem mudanca de dados | Lentidao ao digitar busca |
| `ChatWindow` | Subscription realtime recriada a cada render do useEffect | Overhead de conexao |
| `MessageItem` | Ja usa `memo` (OK) | Baixo impacto |
| `ConversationItem` | Ja usa `memo` (OK) | Baixo impacto |
| `useConversations` | `handleNewMessage` cria novas funcoes internas a cada render | Re-renders desnecessarios na lista |

### 1.2 Listas Longas (Sem Virtualizacao)

| Lista | Volume Tipico | Problema |
|-------|---------------|----------|
| `ConversationList` | 50-200 conversas | Renderiza TODAS as conversas visualmente |
| `ChatWindow` (mensagens) | 50-500+ mensagens | Renderiza todas as mensagens da pagina atual (50) |

O DOM cresce linearmente com o numero de itens, causando:
- Scroll menos fluido
- Maior tempo de reconciliacao React
- Maior uso de memoria

### 1.3 Queries e Chamadas Assincronas

| Hook/Componente | Observacao |
|-----------------|------------|
| `useConversations.fetchConversations` | Ja otimizada com batch query unica para mensagens |
| `useInfiniteMessages.loadInitialMessages` | Faz 2 queries (count + select) - poderia ser 1 |
| `markMessagesAsRead` | Faz updates em batches de 10 - OK |

### 1.4 Gerenciamento de Estado

| Contexto | Problema Potencial |
|----------|-------------------|
| `AuthContext` | OK - estavel |
| `PreviewConversationContext` | OK - escopo limitado |
| Multiple `useState` em hooks | Cada `setX` causa re-render individual |

### 1.5 Animacoes e Transicoes

| Componente | Animacao | Impacto |
|------------|----------|---------|
| `ConversationItem` | `animate-bounce`, `animate-pulse` em badges | Baixo |
| `MessageItem` | Nenhuma animacao pesada | OK |
| `Sidebar` | `transition-all duration-200` | OK |

---

## 2. Estrategia de Otimizacao por Area

### 2.1 Inbox e Conversas (Prioridade CRITICA)

#### 2.1.1 Virtualizacao da Lista de Conversas

**Problema**: `ConversationList` renderiza todas as conversas no DOM simultaneamente.

**Solucao**: Implementar virtualizacao usando `react-virtual` (tanstack) ou `react-window`.

**Beneficio Esperado**:
- Reducao de ~80% no tempo de render inicial
- Scroll de 60fps mesmo com 500+ conversas
- Reducao de uso de memoria

**Implementacao**:

```text
Arquivo: src/components/app/ConversationList.tsx

- Instalar: @tanstack/react-virtual
- Criar ref para container de scroll
- Usar useVirtualizer para calcular items visiveis
- Renderizar apenas ~10-15 conversas visiveis + buffer
```

#### 2.1.2 Virtualizacao de Mensagens no Chat

**Problema**: `ChatWindow` renderiza todas as 50 mensagens da pagina atual.

**Solucao**: Aplicar virtualizacao similar ao historico de mensagens.

**Consideracoes**:
- Scroll reverso (mensagens novas no final)
- Ancoragem no final ao receber nova mensagem
- Preservar posicao ao carregar historico

**Beneficio**: Suporte a conversas de 1000+ mensagens sem degradacao.

#### 2.1.3 Otimizacao de Re-renders na Lista

**Problema**: `filteredConversations` recalcula mesmo quando estados irrelevantes mudam.

**Solucao**: Garantir memoizacao estavel com dependencias corretas.

**Codigo Atual** (linha 195-260):
```typescript
const filteredConversations = useMemo(() => {
  // ...logica de filtragem
}, [combinedConversations, searchTerm, selectedChannel, selectedDepartment, activeTab, resolvedConversations]);
```

**Verificacao**: Dependencias parecem corretas, mas `resolvedConversations` e um `Set` que e recriado no storage sync. Usar referencia estavel ou serializar para comparacao.

### 2.2 Navegacao Geral (Prioridade ALTA)

#### 2.2.1 Pre-loading de Rotas Adjacentes

**Status Atual**: Lazy loading implementado para todas as rotas principais.

**Melhoria Proposta**: Pre-carregar rotas provaveis quando usuario hover no menu.

```text
Arquivo: src/components/app/Sidebar.tsx

- onMouseEnter em cada NavLink
- Chamar import() da rota correspondente
- Cacheado automaticamente pelo bundler
```

**Beneficio**: Navegacao percebida como instantanea (rota ja carregada).

#### 2.2.2 Skeleton de Pagina Especifico

**Status Atual**: Fallback generico (spinner) para todas as paginas.

**Melhoria**: Skeletons especificos por tipo de pagina (Dashboard, Inbox, Settings).

```text
Arquivo: src/App.tsx

Criar componentes:
- DashboardSkeleton
- InboxSkeleton
- SettingsSkeleton
```

**Beneficio**: Percepcao de carregamento mais rapido (layout ja definido).

### 2.3 Sidebar e Menus (Prioridade MEDIA)

#### 2.3.1 Memoizacao de Items de Menu

**Status Atual**: `menuItems` e um array estatico, recriado a cada render.

**Solucao**:

```typescript
const menuItems = useMemo(() => [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3, available: true },
  // ...
], [hasFeature]); // Apenas quando permissoes mudam
```

### 2.4 Formularios e Acoes Criticas (Prioridade MEDIA)

#### 2.4.1 Debounce em Campos de Busca

**Status Atual**: `searchTerm` atualiza a cada keystroke, triggering filtro.

**Solucao**:

```text
Arquivo: src/components/app/ConversationList.tsx

- Usar useDeferredValue para searchTerm
- Ou implementar debounce de 150ms
```

**Beneficio**: Digitacao fluida, sem travamentos.

#### 2.4.2 Envio de Mensagens - Feedback Instantaneo

**Status Atual**: Ja implementado (mensagem temporaria).

**Verificacao**: `handleSendMessage` adiciona `tempMessage` antes da API.

**Status**: OK - padrao de optimistic update correto.

### 2.5 Atualizacoes em Tempo Real (Prioridade ALTA)

#### 2.5.1 Otimizacao do handleNewMessage

**Problema**: Funcao recriada a cada render do hook, causando re-subscricao.

**Solucao**: Usar `useRef` para handlers estaveis.

```text
Arquivo: src/hooks/useConversations.ts

const handleNewMessageRef = useRef(handleNewMessage);
useEffect(() => {
  handleNewMessageRef.current = handleNewMessage;
}, [handleNewMessage]);

// Na subscription:
.on('postgres_changes', ..., (payload) => {
  handleNewMessageRef.current(payload);
})
```

#### 2.5.2 Reducao de Polling Redundante

**Status Atual**: Polling a cada 15s com verificacao de conexao realtime.

**Status**: Ja otimizado com polling adaptativo (60s quando realtime conectado).

### 2.6 Estados de Loading (Prioridade MEDIA)

#### 2.6.1 Skeleton para Items de Lista

**Status Atual**: ConversationList tem skeleton adequado no carregamento inicial.

**Melhoria**: Adicionar skeleton inline para "carregar mais" ao rolar.

```text
Quando isLoadingMore === true:
- Mostrar 2-3 skeletons no topo (historico) ou final (conversas)
- Em vez de apenas indicador generico
```

---

## 3. Implementacoes Detalhadas

### 3.1 Virtualizacao de ConversationList

**Nova Dependencia**: `@tanstack/react-virtual`

**Arquivo**: `src/components/app/ConversationList.tsx`

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// Dentro do componente:
const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
  count: filteredConversations.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80, // altura aproximada de cada item
  overscan: 5, // itens extras renderizados fora da view
});

// No JSX:
<div ref={parentRef} className="flex-1 overflow-y-auto">
  <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
    {virtualizer.getVirtualItems().map(virtualRow => {
      const conversation = filteredConversations[virtualRow.index];
      return (
        <div
          key={conversation.id}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          <ConversationItem {...props} />
        </div>
      );
    })}
  </div>
</div>
```

### 3.2 Virtualizacao de Mensagens

**Arquivo**: `src/components/app/ChatWindow.tsx`

Similar a lista de conversas, mas com scroll reverso:

```typescript
const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => messagesContainerRef.current,
  estimateSize: (index) => {
    // Estimar altura baseado em tipo de mensagem
    const msg = messages[index];
    if (msg.attachment) return 200;
    if (msg.content.length > 200) return 100;
    return 60;
  },
  overscan: 10,
  // Scroll reverso para chat
  getItemKey: (index) => messages[index].id,
});
```

### 3.3 Pre-loading de Rotas

**Arquivo**: `src/components/app/Sidebar.tsx`

```typescript
const routePreloaders: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('@/pages/app/Dashboard'),
  '/inbox': () => import('@/pages/app/Inbox'),
  '/settings': () => import('@/pages/app/Settings'),
  // ...
};

const handleMouseEnter = (url: string) => {
  if (routePreloaders[url]) {
    routePreloaders[url]();
  }
};

// No NavLink:
<NavLink 
  to={item.url}
  onMouseEnter={() => handleMouseEnter(item.url)}
>
```

### 3.4 Debounce na Busca

**Arquivo**: `src/components/app/ConversationList.tsx`

```typescript
import { useDeferredValue } from 'react';

const [searchTerm, setSearchTerm] = useState("");
const deferredSearchTerm = useDeferredValue(searchTerm);

// Usar deferredSearchTerm no useMemo de filteredConversations
const filteredConversations = useMemo(() => {
  // ...usar deferredSearchTerm em vez de searchTerm
}, [combinedConversations, deferredSearchTerm, ...]);
```

### 3.5 Referencia Estavel para Handlers Realtime

**Arquivo**: `src/hooks/useConversations.ts`

```typescript
// No topo do hook:
const handleNewMessageRef = useRef<(payload: any) => void>();

// Atualizar ref quando handler muda:
useEffect(() => {
  handleNewMessageRef.current = handleNewMessage;
});

// No useEffect da subscription (linha ~437):
.on('postgres_changes', { event: 'INSERT', ... }, (payload) => {
  handleNewMessageRef.current?.(payload);
})
```

---

## 4. Metricas e Medicao

### 4.1 Metricas de Performance a Monitorar

| Metrica | Ferramenta | Alvo |
|---------|------------|------|
| First Contentful Paint | Lighthouse | < 1.5s |
| Time to Interactive | Lighthouse | < 3s |
| Scroll FPS | DevTools Performance | 60fps |
| Render Time (lista) | React DevTools Profiler | < 16ms |
| Memory Usage | DevTools Memory | Estavel (sem leaks) |

### 4.2 Testes de Regressao

| Cenario | Verificacao |
|---------|-------------|
| Lista com 200 conversas | Scroll fluido, sem jank |
| Chat com 500 mensagens | Scroll reverso fluido |
| Digitar busca rapido | Sem travamento de UI |
| Receber 10 mensagens seguidas | Updates instantaneos |
| Navegar entre 5 telas | Transicao < 100ms |

---

## 5. Priorizacao e Cronograma de Implementacao

### Fase 1 - Impacto Imediato (Alta Prioridade)

| Item | Arquivo | Esforco | Impacto |
|------|---------|---------|---------|
| Virtualizacao ConversationList | ConversationList.tsx | Medio | Alto |
| Debounce na busca | ConversationList.tsx | Baixo | Medio |
| Handler estavel realtime | useConversations.ts | Baixo | Medio |

### Fase 2 - Percepcao de Velocidade (Media Prioridade)

| Item | Arquivo | Esforco | Impacto |
|------|---------|---------|---------|
| Pre-loading de rotas | Sidebar.tsx | Baixo | Medio |
| Skeletons especificos | App.tsx + componentes | Medio | Medio |
| Virtualizacao de mensagens | ChatWindow.tsx | Alto | Alto |

### Fase 3 - Refinamentos (Baixa Prioridade)

| Item | Arquivo | Esforco | Impacto |
|------|---------|---------|---------|
| Memoizacao menuItems | Sidebar.tsx | Baixo | Baixo |
| Skeleton inline loadMore | ConversationList.tsx | Baixo | Baixo |
| Query unica para count+select | useInfiniteMessages.ts | Baixo | Baixo |

---

## 6. Arquivos a Serem Modificados

### Alta Prioridade

| Arquivo | Alteracoes |
|---------|------------|
| `package.json` | Adicionar @tanstack/react-virtual |
| `src/components/app/ConversationList.tsx` | Virtualizacao + debounce |
| `src/hooks/useConversations.ts` | Ref estavel para handlers |

### Media Prioridade

| Arquivo | Alteracoes |
|---------|------------|
| `src/components/app/Sidebar.tsx` | Pre-loading + memoizacao |
| `src/components/app/ChatWindow.tsx` | Virtualizacao de mensagens |
| `src/App.tsx` | Skeletons especificos por rota |

### Baixa Prioridade

| Arquivo | Alteracoes |
|---------|------------|
| `src/hooks/useInfiniteMessages.ts` | Unificar queries |

---

## 7. Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Virtualizacao quebra scroll position cache | Testar preservacao de posicao |
| Pre-loading aumenta bandwidth inicial | Limitar a rotas mais usadas |
| Debounce atrasa resultados de busca | Usar useDeferredValue (nativo React 18) |
| Mudancas em ConversationList quebram filtros | Testes extensivos de filtragem |

---

## 8. Resultados Esperados

### Antes vs Depois (Estimativas)

| Metrica | Antes | Depois |
|---------|-------|--------|
| Render inicial (200 conversas) | ~300ms | ~50ms |
| Scroll FPS | 30-45 | 60 |
| Navegacao entre telas | 200-400ms | 50-100ms |
| Resposta a digitacao | 50-100ms | < 16ms |
| Memoria (500 msgs) | ~50MB | ~20MB |

---

## 9. Fora de Escopo

Este plano NAO altera:
- Fluxos funcionais existentes
- APIs e Edge Functions
- Estrutura de banco de dados
- Design visual (tratado em plano separado)
- Logica de negocios

---

## 10. Dependencias Novas

| Pacote | Versao | Motivo |
|--------|--------|--------|
| @tanstack/react-virtual | ^3.x | Virtualizacao eficiente de listas |

Total: 1 nova dependencia (leve, ~10KB gzipped).
