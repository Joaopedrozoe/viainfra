# Plano de Revisão Visual da Plataforma ViaInfra

## Status: ✅ FASE 1 IMPLEMENTADA

### Alterações Concluídas

#### 1. Sidebar e Navegação Principal ✅
- **Logo flutuante**: Background branco puro, shadow-sm, padding py-5/px-4, logo h-14 expandido
- **Menu de navegação**: Ícones h-5 w-5, barra lateral primária (border-l-3) em itens ativos, hover:bg-accent/50
- **Área do usuário**: Avatar h-10 com ring-2 ring-primary/20, StatusSelector inline, tipografia refinada

#### 2. Inbox e Chat ✅
- **ChatHeader**: bg-background/95 backdrop-blur-sm, shadow-sm, p-5, ring no avatar
- **ChatInput**: border-t border-border shadow-sm, textarea bg-muted/30, botão bg-primary
- **MessageItem**: Bolhas rounded-2xl shadow-sm, bg-primary/bg-muted/60, timestamp text-[10px]
- **ConversationItem**: Badge bg-primary, fallback avatar bg-muted

#### 3. Dashboard ✅
- **MetricsOverview**: Cards shadow-sm hover:shadow-lg hover:-translate-y-0.5, valores text-3xl
- **DashboardHeader**: font-bold tracking-tight, botão border-dashed
- **ActivityChart/RecentActivity**: Cards border-border/50, Skeletons padronizados

#### 4. Componentes Novos ✅
- `src/components/ui/empty-state.tsx` - Componente reutilizável para estados vazios

#### 5. Tokens e Cores ✅
- Removidas cores hardcoded (bg-gray-*, text-gray-*, bg-viainfra-primary)
- Tokens semânticos aplicados: bg-muted, text-muted-foreground, bg-primary
- Dark mode totalmente suportado

---

## Arquivos Modificados

| Arquivo | Alterações |
|---------|------------|
| `src/components/app/Sidebar.tsx` | Logo flutuante, menu premium, perfil refinado |
| `src/components/app/chat/ChatHeader.tsx` | Tokens, backdrop-blur, spacing |
| `src/components/app/chat/ChatInput.tsx` | Tokens, shadow, bg-muted/30 |
| `src/components/app/chat/MessageItem.tsx` | Bolhas premium, tokens |
| `src/components/app/conversation/ConversationItem.tsx` | Tokens, badge bg-primary |
| `src/components/app/dashboard/MetricsOverview.tsx` | Cards premium, Skeleton |
| `src/components/app/dashboard/DashboardHeader.tsx` | Tipografia, border-dashed |
| `src/components/app/dashboard/ActivityChart.tsx` | Cards premium |
| `src/components/app/dashboard/RecentActivity.tsx` | Skeleton, tokens |
| `src/pages/app/Dashboard.tsx` | bg-muted/30 |
| `src/components/ui/empty-state.tsx` | **NOVO** |

---

## Fase 2 (Opcional - Expansão)

### Arquivos Pendentes
- `src/pages/app/Settings.tsx` - Tabs premium com shadow
- `src/pages/app/Channels.tsx` - Background token
- `src/components/app/settings/*.tsx` - Cards de formulário refinados
- `src/components/app/ConversationList.tsx` - EmptyState integrado

### Melhorias Futuras
- Tooltips com backdrop-blur
- Transições mais suaves em modais
- Badge de contagem em tabs

---

## Fora de Escopo (Preservado)
- ✓ Fluxos funcionais existentes
- ✓ Estrutura de rotas
- ✓ Lógica de negócios
- ✓ Integrações Supabase/APIs
- ✓ Logomarcas ViaInfra e VIALOGISTIC
- ✓ Sistema de temas dual (verde/amarelo)
