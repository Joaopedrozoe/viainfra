
# Plano de Revisao e Aprimoramento do Dashboard

## Resumo Executivo

Este plano transforma o Dashboard em uma ferramenta confiavel de acompanhamento operacional e tecnico, eliminando dados mockados/aleatorios e substituindo por metricas reais do banco de dados Supabase, com visao temporal por periodos e indicadores de saude do sistema.

---

## 1. Diagnostico Atual - Problemas Identificados

### 1.1 Metricas com Dados Aleatorios (Problema Critico)

| Componente | Problema | Linha |
|------------|----------|-------|
| `dashboardUtils.ts` | `hourlyActivity` usa `Math.random()` | 86-92 |
| `dashboardUtils.ts` | `weeklyTrend` usa `Math.random()` | 95-105 |
| Ambos graficos | Dados diferentes a cada refresh, nao refletem realidade | - |

**Dados Reais Disponiveis no Banco:**
- 357 conversas totais (320 abertas, 32 resolvidas, 5 pendentes)
- 11.062 mensagens totais (108 hoje)
- Historico de mensagens por dia (ultimos 7 dias)
- Historico de mensagens por hora (hoje)

### 1.2 Componentes Atuais do Dashboard

| Componente | Proposito | Status |
|------------|-----------|--------|
| `DashboardHeader` | Saudacao + botao refresh | OK |
| `MetricsOverview` | 5 cards de metricas principais | Parcialmente real |
| `ActivityChart` | Atividade por hora (24h) | MOCK - dados aleatorios |
| `ChannelDistributionChart` | Pizza de distribuicao por canal | MOCK - depende de canais |
| `WeeklyTrendChart` | Tendencia semanal (7 dias) | MOCK - dados aleatorios |
| `SystemHealthCheck` | Status de componentes do sistema | OK - dados reais |
| `ChannelHealthPanel` | Status dos canais de atendimento | OK - dados reais |
| `TeamPresence` | Equipe online/offline | OK - dados reais |
| `RecentActivity` | Ultimas conversas | OK - dados reais |

### 1.3 Metricas que Faltam (Visao Tecnica)

| Metrica | Valor para Operacao |
|---------|---------------------|
| Tempo medio de primeira resposta | Critico para SLA |
| Mensagens por hora (real) | Tendencia de carga |
| Conversas por dia (historico real) | Planejamento de capacidade |
| Taxa de resolucao por periodo | Eficiencia da equipe |
| Status dos canais WhatsApp | Monitoramento de conexao |

---

## 2. Arquitetura da Solucao

### 2.1 Nova Estrutura de Dados

```text
dashboardUtils.ts (refatorar)
+-- fetchDashboardMetrics() - busca dados reais do Supabase
    +-- Metricas de Conversas (real)
    +-- Metricas de Mensagens por Hora (real)
    +-- Metricas de Mensagens por Dia (real)
    +-- Status dos Canais (real)
    +-- Tempo de Resposta calculado
```

### 2.2 Fluxo de Dados

```text
Supabase (fonte) --> fetchDashboardMetrics() --> Componentes
                          |
                          +-- Cache local (30s TTL)
                          |
                          +-- Listener 'dashboard-refresh'
```

---

## 3. Implementacoes por Componente

### 3.1 dashboardUtils.ts - Refatorar para Dados Reais

**Problema Central:** As funcoes `calculateDashboardMetrics` usam dados mockados.

**Solucao:** Criar funcoes assincronas que buscam dados do Supabase.

**Novas Funcoes:**

```typescript
// Buscar metricas de conversas
async function fetchConversationMetrics(companyId: string) {
  const { data } = await supabase
    .from('conversations')
    .select('status, created_at')
    .eq('company_id', companyId);
  
  return {
    total: data.length,
    open: data.filter(c => c.status === 'open').length,
    resolved: data.filter(c => c.status === 'resolved').length,
    pending: data.filter(c => c.status === 'pending').length,
    today: data.filter(c => isToday(c.created_at)).length
  };
}

// Buscar mensagens por hora (hoje) - SUBSTITUIR Math.random()
async function fetchHourlyActivity(companyId: string) {
  const { data } = await supabase
    .from('messages')
    .select('created_at')
    .gte('created_at', todayStart)
    .order('created_at');
  
  // Agrupar por hora
  return groupByHour(data);
}

// Buscar tendencia semanal (7 dias) - SUBSTITUIR Math.random()
async function fetchWeeklyTrend(companyId: string) {
  const { data } = await supabase
    .from('messages')
    .select('created_at')
    .gte('created_at', sevenDaysAgo)
    .order('created_at');
  
  // Agrupar por dia
  return groupByDay(data);
}
```

### 3.2 ActivityChart.tsx - Atividade por Hora (Real)

**Antes:** Dados aleatorios `Math.random() * (i >= 9 && i <= 18 ? 50 : 10)`

**Depois:** Query real de mensagens agrupadas por hora

**Beneficio:** Identificar picos de demanda, horarios de maior atividade

### 3.3 WeeklyTrendChart.tsx - Tendencia Semanal (Real)

**Antes:** Dados aleatorios para 7 dias

**Depois:** Query real com agregacao por data

**Melhorias Adicionais:**
- Adicionar comparacao com semana anterior (linha pontilhada)
- Tooltip com detalhes (conversas vs mensagens)

### 3.4 MetricsOverview.tsx - Cards Principais

**Cards Atuais (manter):**

| Card | Fonte Atual | Acao |
|------|-------------|------|
| Conversas Ativas | Supabase | OK |
| Mensagens Hoje | Misto | Corrigir para query direta |
| Tempo de Resposta | Calculado | Melhorar calculo |
| Taxa de Resolucao | Calculado | OK |
| Canais Online | localStorage | Migrar para Supabase |

**Card Novo Proposto:**
- Substituir "Canais Online" por "Tempo Medio 1a Resposta" (mais relevante para SLA)

### 3.5 SystemHealthCheck.tsx - Expandir Metricas Tecnicas

**Atual:** 4 verificacoes basicas (Frontend, Database, Auth, Chat)

**Proposta de Expansao:**

| Check Atual | Manter |
|-------------|--------|
| Frontend Application | Sim |
| Database Connection | Sim |
| Autenticacao | Sim |
| Sistema de Chat | Sim |

| Check Novo | Valor |
|------------|-------|
| WhatsApp Connection | Status da instancia (`connection_state`) |
| Realtime Subscription | Verificar se channel esta ativo |
| API Latency | Medir tempo de resposta da query |
| Queue Status | Verificar `message_queue` pendentes |

**Implementacao do API Latency:**

```typescript
// Medir latencia de query
const start = performance.now();
await supabase.from('companies').select('count').limit(1);
const latency = performance.now() - start;

return {
  component: 'API Latency',
  status: latency < 100 ? 'healthy' : latency < 300 ? 'warning' : 'error',
  message: `${Math.round(latency)}ms`,
};
```

### 3.6 ChannelDistributionChart.tsx - Ajustar para Dados Reais

**Problema:** Depende de `channelDistribution` que vem de localStorage

**Solucao:** Query mensagens agrupadas por canal real

```typescript
// Distribuicao real por canal
const { data } = await supabase
  .from('conversations')
  .select('channel')
  .eq('company_id', companyId);

// Contar por canal
const channelCounts = data.reduce((acc, c) => {
  acc[c.channel] = (acc[c.channel] || 0) + 1;
  return acc;
}, {});
```

---

## 4. Nova Secao: Visao Temporal e Tendencias

### 4.1 Novo Componente: PerformanceMetricsChart

**Proposito:** Graficos de linha por periodo mostrando tendencias

**Conteudo:**
- Mensagens por dia (ultimos 7/14/30 dias)
- Conversas iniciadas por dia
- Taxa de resolucao por dia
- Tempo medio de resposta por dia

**Seletor de Periodo:**
- 7 dias (padrao)
- 14 dias
- 30 dias

### 4.2 Formato do Grafico

```text
[Titulo: Tendencias de Atendimento]
[Seletor: 7 dias | 14 dias | 30 dias]

Linha 1 (primaria): Mensagens/dia
Linha 2 (secundaria): Conversas/dia
Eixo X: Datas
Eixo Y: Contagem
```

---

## 5. Reorganizacao do Layout

### 5.1 Layout Atual

```text
Row 1: [DashboardHeader]
Row 2: [MetricsOverview - 5 cards]
Row 3: [ActivityChart] [ChannelDistributionChart]
Row 4: [WeeklyTrendChart] [SystemHealthCheck]
Row 5: [ChannelHealthPanel] [TeamPresence]
Row 6: [RecentActivity]
```

### 5.2 Layout Proposto (Prioridade Hierarquica)

```text
Row 1: [DashboardHeader com status geral]
Row 2: [MetricsOverview - 5 cards principais]

--- Secao: Atividade e Tendencias ---
Row 3: [ActivityChart - Hoje por Hora] [WeeklyTrendChart - 7 dias]

--- Secao: Canais e Performance ---
Row 4: [ChannelDistributionChart] [ChannelHealthPanel]

--- Secao: Sistema e Equipe ---
Row 5: [SystemHealthCheck EXPANDIDO] [TeamPresence]

--- Secao: Detalhes ---
Row 6: [RecentActivity]
```

**Justificativa:**
- Metricas mais acionaveis primeiro (cards)
- Tendencias temporais juntas (atividade + semanal)
- Status operacional agrupado (canais)
- Status tecnico com equipe (suporte)
- Detalhes por ultimo (consulta eventual)

---

## 6. Detalhamento Tecnico das Alteracoes

### 6.1 dashboardUtils.ts - Refatoracao Completa

**Arquivo:** `src/components/app/dashboard/dashboardUtils.ts`

**Alteracoes:**

1. Adicionar nova interface para metricas expandidas:

```typescript
export interface DashboardMetrics {
  // Conversas (existente)
  activeConversations: number;
  totalConversations: number;
  todayMessages: number;
  
  // Performance (expandir)
  averageResponseTime: number;
  firstResponseTime: number; // NOVO
  resolutionRate: number;
  
  // Canais (existente)
  connectedChannels: number;
  totalChannels: number;
  
  // Atividade - DADOS REAIS
  hourlyActivity: { hour: string; messages: number }[];
  weeklyTrend: { day: string; date: string; conversations: number; messages: number }[];
  channelDistribution: { name: string; value: number; percentage: number }[];
  
  // NOVO - Tendencias
  previousWeekTrend?: { day: string; date: string; conversations: number; messages: number }[];
  
  // NOVO - Sistema
  apiLatency?: number;
  whatsappStatus?: 'connected' | 'disconnected' | 'error';
  queuedMessages?: number;
}
```

2. Criar nova funcao assincrona principal:

```typescript
export async function fetchDashboardMetrics(companyId: string): Promise<DashboardMetrics> {
  // Todas as queries em paralelo para performance
  const [
    conversationStats,
    hourlyData,
    weeklyData,
    channelData,
    whatsappStatus,
    queueStatus
  ] = await Promise.all([
    fetchConversationStats(companyId),
    fetchHourlyActivity(companyId),
    fetchWeeklyTrend(companyId),
    fetchChannelDistribution(companyId),
    fetchWhatsAppStatus(companyId),
    fetchQueueStatus(companyId)
  ]);

  return {
    ...conversationStats,
    hourlyActivity: hourlyData,
    weeklyTrend: weeklyData,
    channelDistribution: channelData,
    whatsappStatus,
    queuedMessages: queueStatus
  };
}
```

3. Remover `Math.random()` das linhas 86-92 e 95-105

### 6.2 Componentes - Migrar para useEffect Assincrono

**Padrao para todos os componentes:**

```typescript
// ANTES (sincrono com mock)
const calculatedMetrics = calculateDashboardMetrics(isDemoMode);

// DEPOIS (assincrono com dados reais)
useEffect(() => {
  const loadMetrics = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const data = await fetchDashboardMetrics(companyId);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };
  loadMetrics();
}, [companyId]);
```

### 6.3 SystemHealthCheck.tsx - Adicionar Verificacoes

**Linhas a adicionar (apos linha 83):**

```typescript
// WhatsApp connection check
(async () => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('connection_state, instance_name')
      .limit(1)
      .single();
    
    return {
      component: 'WhatsApp',
      status: data?.connection_state === 'open' ? 'healthy' : 'warning',
      message: data?.connection_state === 'open' 
        ? `${data.instance_name} conectado` 
        : 'Instancia desconectada',
      lastCheck: new Date().toLocaleTimeString('pt-BR')
    };
  } catch {
    return {
      component: 'WhatsApp',
      status: 'error',
      message: 'Erro ao verificar WhatsApp',
      lastCheck: new Date().toLocaleTimeString('pt-BR')
    };
  }
})(),

// API Latency check
(async () => {
  const start = performance.now();
  try {
    await supabase.from('companies').select('id').limit(1);
    const latency = Math.round(performance.now() - start);
    
    return {
      component: 'API Latency',
      status: latency < 200 ? 'healthy' : latency < 500 ? 'warning' : 'error',
      message: `${latency}ms`,
      lastCheck: new Date().toLocaleTimeString('pt-BR')
    };
  } catch {
    return {
      component: 'API Latency',
      status: 'error',
      message: 'Timeout',
      lastCheck: new Date().toLocaleTimeString('pt-BR')
    };
  }
})(),

// Message queue check
(async () => {
  try {
    const { count, error } = await supabase
      .from('message_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    const pending = count || 0;
    return {
      component: 'Fila de Mensagens',
      status: pending < 10 ? 'healthy' : pending < 50 ? 'warning' : 'error',
      message: `${pending} pendentes`,
      lastCheck: new Date().toLocaleTimeString('pt-BR')
    };
  } catch {
    return {
      component: 'Fila de Mensagens',
      status: 'warning',
      message: 'Nao monitorado',
      lastCheck: new Date().toLocaleTimeString('pt-BR')
    };
  }
})(),
```

---

## 7. Nomenclaturas e Clareza

### 7.1 Ajustes de Nomenclatura

| Atual | Proposto | Razao |
|-------|----------|-------|
| "Atividade nas Ultimas 24 Horas" | "Mensagens por Hora (Hoje)" | Mais preciso |
| "Tendencia Semanal" | "Historico dos Ultimos 7 Dias" | Mais claro |
| "Status dos Canais" | "Canais de Atendimento" | Mais objetivo |
| "Status do Sistema" | "Saude do Sistema" | Terminologia tecnica |
| "Equipe" | "Equipe Online" | Indica proposito |

### 7.2 Tooltips Informativos

Adicionar tooltips explicativos em cada metrica:

```typescript
// Exemplo no MetricsOverview
const cards = [
  {
    title: "Conversas Ativas",
    tooltip: "Conversas com status 'aberto' ou 'pendente'",
    ...
  },
  {
    title: "Tempo de Resposta",
    tooltip: "Media de tempo entre mensagem do cliente e resposta do agente",
    ...
  }
];
```

---

## 8. Estados Vazios e Carregamento

### 8.1 Padronizar Loading States

**Usar Skeleton para todos os componentes:**

```typescript
// Padrao de loading
if (isLoading) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}
```

### 8.2 Estados Vazios com Acao

```typescript
// Estado vazio com acao
if (data.length === 0) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium">Nenhuma atividade registrada</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Dados aparecerao conforme mensagens forem recebidas
        </p>
      </CardContent>
    </Card>
  );
}
```

---

## 9. Arquivos a Serem Modificados

### Alta Prioridade (Dados Reais)

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/app/dashboard/dashboardUtils.ts` | Refatorar para queries reais, remover Math.random() |
| `src/components/app/dashboard/ActivityChart.tsx` | Usar dados reais de mensagens por hora |
| `src/components/app/dashboard/WeeklyTrendChart.tsx` | Usar dados reais de mensagens por dia |
| `src/components/app/SystemHealthCheck.tsx` | Adicionar verificacoes de WhatsApp, latencia, fila |

### Media Prioridade (Melhorias)

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/app/dashboard/MetricsOverview.tsx` | Tooltips, ajuste de "Canais Online" |
| `src/components/app/dashboard/ChannelDistributionChart.tsx` | Query real por canal |
| `src/components/app/dashboard/DashboardHeader.tsx` | Indicador de status geral |

### Baixa Prioridade (Refinamentos)

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/app/Dashboard.tsx` | Reorganizar layout se necessario |
| Todos componentes | Padronizar loading/empty states |

---

## 10. Beneficios Esperados

| Metrica | Antes | Depois |
|---------|-------|--------|
| Confiabilidade dos dados | Baixa (mock) | Alta (Supabase) |
| Valor para decisao | Nenhum | Alto (tendencias reais) |
| Identificacao de problemas | Manual | Automatica (health checks) |
| Tempo para insight | N/A | Imediato (dados atuais) |

---

## 11. Fora de Escopo

Este plano NAO altera:
- Fluxos funcionais existentes
- Design visual (cores, espacamentos) - tratado em plano separado
- Estrutura de banco de dados
- Edge functions
- Logica de negocios

---

## 12. Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Queries pesadas no Dashboard | Cache de 30s, queries otimizadas com limit |
| Latencia no carregamento | Loading states, Promise.all paralelo |
| Dados vazios em ambiente novo | Estados vazios informativos |
| Erro em query especifica | Fallback graceful, nao quebra outros componentes |
