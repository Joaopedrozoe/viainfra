
# Plano de Revisao e Atualizacao Visual da Plataforma ViaInfra

## Resumo Executivo

Este plano propoe uma revisao visual abrangente para elevar a percepcao de qualidade da plataforma a um padrao enterprise/premium, mantendo a identidade visual ViaInfra (verde institucional) e VIALOGISTIC (amarelo dourado) conforme as diretrizes estabelecidas.

---

## 1. Sidebar e Navegacao Principal

### 1.1 Area Superior - Logo Flutuante

**Estado Atual:**
- Logo em area com `border-b` e padding `py-2 px-2`
- Altura do logo: `h-10` (40px) expandido, `h-8` (32px) colapsado
- Background herda `--sidebar-background: 0 0% 98%` (cinza claro)

**Proposta Premium:**
- Criar area destacada com fundo branco puro (`bg-white`) para efeito de logo flutuante
- Aumentar padding vertical para `py-5` e horizontal para `px-4`
- Aumentar tamanho do logo para `h-14` (56px) expandido, `h-10` colapsado
- Adicionar `shadow-sm` sutil na borda inferior em vez de `border-b`
- Transicao suave no hover: `hover:shadow-md`

**Arquivos:**
- `src/components/app/Sidebar.tsx` linhas 85-102

### 1.2 Menu de Navegacao

**Estado Atual:**
- Itens com `SidebarMenuButton` padrao do Radix
- Icones `h-4 w-4` (16px)
- Sem indicador visual de secao ativa alem do background

**Proposta Premium:**
- Aumentar icones para `h-5 w-5` (20px) para melhor legibilidade
- Item ativo: barra lateral esquerda de 3px na cor primaria (`border-l-3 border-primary`)
- Hover mais sutil: `hover:bg-accent/60` em vez de 100%
- Espacamento entre itens: `gap-1.5` em vez de `gap-1`
- Tipografia: `font-medium` no item ativo, `font-normal` nos demais

**Arquivos:**
- `src/components/ui/sidebar.tsx` linhas 486-497 (SidebarMenu)
- `src/components/app/Sidebar.tsx` linhas 157-178

### 1.3 Area do Usuario (Perfil)

**Estado Atual:**
- Avatar `h-8 w-8` com nome e email truncados
- StatusSelector centralizado abaixo

**Proposta Premium:**
- Avatar `h-10 w-10` com ring sutil na cor primaria (`ring-2 ring-primary/20`)
- Nome com `font-semibold` e tamanho `text-sm`
- Email com `text-xs text-muted-foreground/70`
- StatusSelector inline com o perfil (ao lado direito)
- Separador visual (`Separator`) entre perfil e menu

**Arquivos:**
- `src/components/app/Sidebar.tsx` linhas 119-154

---

## 2. Inbox e Visualizacao de Conversas

### 2.1 Header do Chat

**Estado Atual:**
- `bg-white border-b border-gray-200`
- Avatar `w-10 h-10` com cores hardcoded (`bg-gray-300`, `text-gray-500`)

**Proposta Premium:**
- Background: `bg-background/95 backdrop-blur-sm` para efeito premium
- Avatar com ring: `ring-2 ring-border`
- Remover cores hardcoded, usar tokens: `bg-muted`, `text-muted-foreground`
- Shadow sutil: `shadow-sm`
- Padding aumentado: `p-5` em vez de `p-4`

**Arquivos:**
- `src/components/app/chat/ChatHeader.tsx` linhas 162-298

### 2.2 Lista de Conversas

**Estado Atual:**
- Items com `border-b border-border`
- Avatar `w-12 h-12`
- Preview `text-sm text-muted-foreground`
- Badge de contagem `bg-viainfra-primary` hardcoded

**Proposta Premium:**
- Remover `border-b`, usar `divide-y divide-border/50` no container pai
- Item selecionado: `bg-primary/5` com `shadow-sm` interno
- Hover mais sutil: `hover:bg-muted/50`
- Avatar com `ring-1 ring-border` para definicao
- Badge de contagem: `bg-primary` (usa variavel, funciona com temas)
- Adicionar indicador de status online (ponto verde) no avatar

**Arquivos:**
- `src/components/app/conversation/ConversationItem.tsx` linhas 139-260
- `src/components/app/ConversationList.tsx` linhas 379+

### 2.3 Bolhas de Mensagem

**Estado Atual:**
- Agente: `bg-viainfra-primary text-white rounded-tr-none`
- Usuario: `bg-card border border-border rounded-tl-none`
- Padding `p-3`

**Proposta Premium:**
- Agente: `bg-primary text-primary-foreground` (respeitando tema)
- Usuario: `bg-muted/50` (mais sutil que card)
- Padding aumentado: `px-4 py-3`
- Border-radius mais suave: `rounded-2xl` com corner especifico `rounded-tr-md` / `rounded-tl-md`
- Shadow sutil nas mensagens: `shadow-sm`
- Timestamp com `text-[10px]` e alinhamento mais proximo do texto

**Arquivos:**
- `src/components/app/chat/MessageItem.tsx` linhas 427-535

### 2.4 Input de Mensagem

**Estado Atual:**
- Textarea com `min-h-10 max-h-32`
- Botoes com cores hardcoded (`bg-green-600`, `text-gray-400`)

**Proposta Premium:**
- Container: `bg-background border-t border-border shadow-sm`
- Textarea: `bg-muted/30 border-0 focus:ring-1 focus:ring-primary/50`
- Botao enviar: `bg-primary hover:bg-primary/90` (sem hardcode)
- Botoes secundarios: `text-muted-foreground hover:text-foreground`
- Padding aumentado: `p-4`

**Arquivos:**
- `src/components/app/chat/ChatInput.tsx`

---

## 3. Dashboard

### 3.1 Cards de Metricas

**Estado Atual:**
- Grid responsivo adequado
- Cores hardcoded para icones (`text-blue-600`, `bg-blue-50`, etc)
- Shadow `hover:shadow-md`

**Proposta Premium:**
- Usar paleta semantica: success (verde), warning (amarelo), info (azul)
- Shadow base: `shadow-sm` com `hover:shadow-lg hover:-translate-y-0.5`
- Border: `border border-border/50`
- Icones maiores: `h-5 w-5` em vez de `h-4 w-4`
- Valor principal: `text-3xl font-bold` em vez de `text-2xl`

**Arquivos:**
- `src/components/app/dashboard/MetricsOverview.tsx` linhas 59-116

### 3.2 Header do Dashboard

**Estado Atual:**
- Saudacao simples com data/hora
- Botao de refresh com estilo padrao

**Proposta Premium:**
- Tipografia: `text-3xl font-bold tracking-tight`
- Data: `text-muted-foreground font-medium`
- Adicionar breadcrumb discreto
- Botao refresh: `variant="outline"` com `border-dashed`

**Arquivos:**
- `src/components/app/dashboard/DashboardHeader.tsx`

### 3.3 Graficos

**Estado Atual:**
- Usando Recharts com cores primarias
- Container cards simples

**Proposta Premium:**
- Adicionar legendas mais claras
- Grid lines mais sutis: `stroke-muted/30`
- Tooltips com `backdrop-blur-sm bg-popover/95`
- Titulos de secao com `text-lg font-semibold` e icone contextual

**Arquivos:**
- `src/components/app/dashboard/ActivityChart.tsx`
- `src/components/app/dashboard/ChannelDistributionChart.tsx`
- `src/components/app/dashboard/WeeklyTrendChart.tsx`

---

## 4. Telas de Configuracoes e Formularios

### 4.1 Tabs de Navegacao

**Estado Atual:**
- `TabsList` com `bg-muted/50` e triggers basicos
- Mobile usa dropdown quando overflow

**Proposta Premium:**
- `TabsList`: `bg-muted rounded-lg p-1`
- `TabsTrigger`: `data-[state=active]:bg-background data-[state=active]:shadow-sm`
- Transicao suave: `transition-all duration-200`
- Badge de contagem em tabs relevantes (ex: Usuarios, Notificacoes)

**Arquivos:**
- `src/pages/app/Settings.tsx` linhas 222-238

### 4.2 Cards de Formulario

**Estado Atual:**
- Cards basicos com `CardHeader`, `CardContent`, `CardFooter`
- Labels e inputs padrao

**Proposta Premium:**
- Cards: `shadow-sm hover:shadow-md transition-shadow`
- Labels: `text-sm font-medium text-foreground`
- Inputs: `h-11` (mais altos para touch)
- Secoes com divisores visuais: `Separator` com `my-6`
- Grupos de campos: `bg-muted/30 rounded-lg p-4`

**Arquivos:**
- `src/pages/app/Settings.tsx`
- `src/components/app/settings/ProfileSettings.tsx`
- `src/components/app/settings/UsersManagement.tsx`

---

## 5. Estados Vazios, Loading e Feedbacks

### 5.1 Estados Vazios

**Estado Atual:**
- Texto simples centralizado
- Alguns com icones, outros nao
- Estilos inconsistentes (`text-gray-500`, `text-muted-foreground`)

**Proposta Premium:**
- Criar componente reutilizavel `EmptyState`:
  ```
  - Icone grande (48px) com `text-muted-foreground/40`
  - Titulo: `text-lg font-medium text-foreground`
  - Descricao: `text-sm text-muted-foreground`
  - Acao opcional: `Button variant="outline"`
  - Container: `py-12 flex flex-col items-center`
  ```

**Arquivos a criar:**
- `src/components/ui/empty-state.tsx`

**Arquivos a atualizar:**
- `src/components/app/ConversationList.tsx` linha 438
- `src/components/app/dashboard/RecentActivity.tsx` linha 153
- `src/components/app/agents/details/AgentTraining.tsx` linhas 121-125

### 5.2 Estados de Loading

**Estado Atual:**
- Skeleton basico em alguns lugares
- `animate-pulse` inconsistente
- Alguns usam texto "Carregando..."

**Proposta Premium:**
- Padronizar uso de `Skeleton` do shadcn
- Adicionar `animate-pulse` suave em todos
- Loading states devem espelhar layout final
- Spinners: usar `Loader2` com `animate-spin` apenas em botoes/acoes

**Arquivos:**
- `src/components/app/dashboard/MetricsOverview.tsx` linhas 43-56
- `src/components/app/ConversationList.tsx` linhas 265-300
- `src/components/app/dashboard/ActivityChart.tsx` linhas 54-67

### 5.3 Toasts e Notificacoes

**Estado Atual:**
- Usando Sonner com estilos padrao
- Posicao: bottom-right

**Proposta Premium:**
- Manter Sonner, ajustar estilos:
  - Success: `bg-green-50 border-green-200 text-green-800`
  - Error: `bg-red-50 border-red-200 text-red-800`
  - Info: `bg-blue-50 border-blue-200 text-blue-800`
- Adicionar icone contextual
- Duration padronizada: 4000ms para info, 6000ms para erros

**Arquivos:**
- `src/components/ui/sonner.tsx`

---

## 6. Padronizacao de Tokens e Cores

### 6.1 Remocao de Cores Hardcoded

**Ocorrencias identificadas:**
- `bg-gray-100`, `bg-gray-200`, `bg-gray-300` (substituir por `bg-muted`)
- `text-gray-500`, `text-gray-600` (substituir por `text-muted-foreground`)
- `bg-green-500`, `text-green-600` (substituir por `bg-primary`, `text-primary`)
- `border-gray-200` (substituir por `border-border`)

**Arquivos afetados:**
- `src/components/app/chat/ChatHeader.tsx`
- `src/components/app/chat/MessageItem.tsx`
- `src/components/app/conversation/ConversationItem.tsx`
- `src/pages/app/Dashboard.tsx` (`bg-gray-50`)
- `src/pages/app/Channels.tsx` (`bg-gray-50`)

### 6.2 Hierarquia Tipografica

**Proposta de padronizacao:**

| Elemento | Classes |
|----------|---------|
| H1 (Pagina) | `text-2xl sm:text-3xl font-bold tracking-tight` |
| H2 (Secao) | `text-xl font-semibold` |
| H3 (Card) | `text-lg font-medium` |
| Body | `text-sm text-foreground` |
| Caption | `text-xs text-muted-foreground` |
| Label | `text-sm font-medium` |

---

## 7. Espacamento e Alinhamento

### 7.1 Padronizacao de Padding

**Proposta:**
| Contexto | Mobile | Desktop |
|----------|--------|---------|
| Container pagina | `p-4` | `p-6` |
| Cards | `p-4` | `p-6` |
| Modais | `p-4` | `p-6` |
| Inputs | `px-3 py-2` | `px-4 py-3` |

### 7.2 Grid e Gaps

**Padronizar gaps:**
- Entre cards: `gap-4 sm:gap-6`
- Entre elementos em form: `space-y-4`
- Entre secoes: `space-y-6 sm:space-y-8`

---

## 8. Acessibilidade e Interatividade

### 8.1 Estados Interativos

**Padronizar:**
- Hover: `hover:bg-accent/50` ou `hover:opacity-90`
- Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Active: `active:scale-[0.98]`
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`

### 8.2 Transicoes

**Padronizar:**
- Hover/state changes: `transition-colors duration-150`
- Layout changes: `transition-all duration-200`
- Modal/Sheet: `duration-300 ease-out`

---

## 9. Resumo de Arquivos a Modificar

### Alta Prioridade (Impacto Visual Imediato)

| Arquivo | Alteracoes |
|---------|------------|
| `src/components/app/Sidebar.tsx` | Logo flutuante, espacamento, menu refinado |
| `src/components/app/chat/ChatHeader.tsx` | Tokens de cor, shadow, spacing |
| `src/components/app/conversation/ConversationItem.tsx` | Tokens, hover, badges |
| `src/components/app/chat/MessageItem.tsx` | Bolhas premium, tokens |
| `src/index.css` | Ajustes finos em variaveis CSS |

### Media Prioridade (Consistencia)

| Arquivo | Alteracoes |
|---------|------------|
| `src/components/app/dashboard/MetricsOverview.tsx` | Cards premium |
| `src/components/app/chat/ChatInput.tsx` | Tokens, spacing |
| `src/pages/app/Dashboard.tsx` | Background token |
| `src/pages/app/Settings.tsx` | Tabs, forms |

### Componentes Novos

| Arquivo | Descricao |
|---------|-----------|
| `src/components/ui/empty-state.tsx` | Componente reutilizavel para estados vazios |

---

## 10. Fora de Escopo

Este plano NAO altera:
- Fluxos funcionais existentes
- Estrutura de rotas
- Logica de negocios
- Integracao com Supabase/APIs
- Logomarcas ViaInfra e VIALOGISTIC
- Sistema de temas dual (ViaInfra verde, ViaLogistic amarelo)

---

## Resultado Esperado

- Percepcao premium e corporativa
- Hierarquia visual clara
- Consistencia entre telas
- Melhor legibilidade em uso prolongado
- Reducao de poluicao visual
- Logo com destaque institucional adequado
