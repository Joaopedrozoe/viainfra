# Plano de Otimização - ViaInfra

## Status de Implementação

### ✅ Fase 1 - Performance UI (Concluída)
- [x] Virtualização do ConversationList com @tanstack/react-virtual
- [x] Debounce na busca com useDeferredValue
- [x] Refs estáveis para handlers realtime (useConversations.ts)
- [x] Pre-loading de rotas no Sidebar

### ✅ Fase 2 - Dashboard com Dados Reais (Concluída)
- [x] **dashboardUtils.ts** - Refatorado para queries Supabase reais
  - Removido Math.random() de hourlyActivity e weeklyTrend
  - Criadas funções assíncronas: fetchHourlyActivity, fetchWeeklyTrend, fetchChannelDistribution
  - Implementado cache de 30s com invalidação manual
- [x] **ActivityChart.tsx** - Agora exibe mensagens por hora reais do dia
- [x] **WeeklyTrendChart.tsx** - Histórico real dos últimos 7 dias
- [x] **ChannelDistributionChart.tsx** - Distribuição real por canal
- [x] **MetricsOverview.tsx** - Métricas reais com tooltips explicativos
- [x] **SystemHealthCheck.tsx** - Expandido com 7 verificações:
  - Aplicação Frontend
  - Latência da API (tempo de resposta)
  - Banco de Dados
  - Autenticação
  - WhatsApp (status da instância)
  - Fila de Mensagens (pendentes)
  - Tempo Real (WebSocket)
- [x] **DashboardHeader.tsx** - Badge de "Tempo real" adicionado
- [x] **Dashboard.tsx** - Layout reorganizado por prioridade

---

## Próximas Melhorias (Pendentes)

### Fase 3 - Refinamentos
- [ ] Virtualização de mensagens no ChatWindow
- [ ] Skeletons específicos por tipo de página (Dashboard, Inbox, Settings)
- [ ] Memoização de menuItems no Sidebar
- [ ] Query única para count+select no useInfiniteMessages

---

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/app/dashboard/dashboardUtils.ts` | Queries Supabase reais |
| `src/components/app/dashboard/ActivityChart.tsx` | Dados hourly reais |
| `src/components/app/dashboard/WeeklyTrendChart.tsx` | Histórico 7 dias real |
| `src/components/app/dashboard/ChannelDistributionChart.tsx` | Distribuição real |
| `src/components/app/dashboard/MetricsOverview.tsx` | Tooltips + dados reais |
| `src/components/app/dashboard/DashboardHeader.tsx` | Badge tempo real |
| `src/components/app/SystemHealthCheck.tsx` | +3 verificações técnicas |
| `src/pages/app/Dashboard.tsx` | Layout reorganizado |
| `src/components/app/ConversationList.tsx` | Virtualização + debounce |
| `src/hooks/useConversations.ts` | Refs estáveis para handlers |
| `src/components/app/Sidebar.tsx` | Pre-loading de rotas |

---

## Dependências Adicionadas

- `@tanstack/react-virtual` - Virtualização eficiente de listas

---

## Resultados Esperados

| Métrica | Antes | Depois |
|---------|-------|--------|
| Dados do Dashboard | Mock (Math.random) | Reais (Supabase) |
| Verificações de saúde | 4 | 7 |
| Render inicial (200 conversas) | ~300ms | ~50ms |
| Scroll FPS | 30-45 | 60 |
| Navegação entre telas | 200-400ms | 50-100ms |
