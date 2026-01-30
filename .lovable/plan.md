
# Plano de Revisao de Performance: Envio e Recebimento de Mensagens

## Resumo Executivo

Apos analise detalhada do codigo, logs e arquitetura do sistema, foi possivel identificar o estado atual da performance e mapear os pontos de atencao que podem impactar a percepcao de lentidao relatada pelas usuarios do Inbox.

---

## Estado Atual da Performance

### Metricas Observadas nos Logs (dados reais)

| Componente | Tempo Medio | Observacao |
|------------|-------------|------------|
| `evolution-webhook` | 120-2236ms | Variacao significativa |
| `send-whatsapp-message` | ~2 segundos | Tempo de envio individual |
| `realtime-sync` | 20-23 segundos | Funcao pesada de sincronizacao |
| Boot das Edge Functions | 30-84ms | Cold start |

### Fluxo de Envio Atual (Analise Tecnica)

```text
Usuario clica "Enviar"
        |
        v (instantaneo)
Mensagem temporaria adicionada a UI
        |
        v (~100-300ms)
Query para buscar canal da conversa no banco
        |
        v (~100-200ms)
INSERT da mensagem na tabela messages
        |
        v (~30-84ms)
Cold start da Edge Function (se nao estava ativa)
        |
        v (~2000ms)
Chamada ao Evolution API para envio WhatsApp
        |
        v (~50-100ms)
UPDATE do metadata com messageId
        |
        v (realtime)
Supabase Realtime atualiza a UI
```

**Tempo total percebido pelo usuario: 2-3 segundos**

### Fluxo de Recebimento Atual

```text
Mensagem chega no WhatsApp
        |
        v (~100-500ms)
Webhook Evolution API -> evolution-webhook Edge Function
        |
        v (30-84ms)
Cold start (se necessario)
        |
        v (~500-2000ms)
Processamento: buscar/criar contato, conversa, salvar mensagem
        |
        v (realtime)
Supabase Realtime notifica o frontend
        |
        v (instantaneo)
UI atualiza com nova mensagem
```

**Tempo total: 1-3 segundos desde chegada no WhatsApp ate aparecer na tela**

---

## Pontos de Atencao Identificados

### 1. Polling Excessivo na Lista de Conversas

**Localizacao**: `src/hooks/useConversations.ts` linhas 452-467

**Observacao**:
- O hook executa `fetchConversations()` a cada 15 segundos
- MESMO quando o realtime esta funcionando normalmente
- Cada fetch busca ate 200 conversas + faz N queries para buscar ultima mensagem

**Impacto potencial**: Consumo de recursos do banco e sobrecarga de requests

```typescript
// Codigo atual (linha 462-466)
} else {
  // Occasional sync even when realtime works (every 30s)
  console.log('🔄 Routine sync poll');
  fetchConversations(true);  // <-- Executa SEMPRE, mesmo com realtime ok
}
```

### 2. Queries Sequenciais para Ultima Mensagem

**Localizacao**: `src/hooks/useConversations.ts` linhas 129-161

**Observacao**:
- Para cada conversa, faz uma query separada para buscar a ultima mensagem
- Queries em batches de 30, mas ainda assim multiplas roundtrips ao banco
- Busca 5 mensagens por conversa para filtrar reacoes

**Calculo de impacto**:
- 200 conversas = 7 batches de queries
- Cada batch pode levar 100-300ms
- Total: 700-2100ms apenas para buscar ultimas mensagens

### 3. Funcao realtime-sync Pesada

**Localizacao**: `supabase/functions/realtime-sync/index.ts`

**Observacao dos logs**:
- Tempo de execucao: 20-23 segundos
- Chamada automaticamente pelo botao "Refresh"
- Pode bloquear recursos se acionada frequentemente

### 4. Query Dupla ao Enviar Mensagem

**Localizacao**: `src/components/app/ChatWindow.tsx` linhas 293-298

**Observacao**:
- Antes de enviar, faz uma query para buscar o canal da conversa
- Essa informacao ja esta disponivel no state (`conversationChannel`)
- Query redundante adiciona 100-200ms ao envio

```typescript
// Query potencialmente redundante
const { data: conversationData, error: convError } = await supabase
  .from('conversations')
  .select('channel')
  .eq('id', conversationId)
  .single();
```

### 5. Auto-sync de Avatares no Carregamento

**Localizacao**: `src/pages/app/Inbox.tsx` linhas 47-70

**Observacao**:
- Dispara `auto-sync-avatars` 10 segundos apos carregar a pagina
- Logs mostram que essa funcao retorna erro 500 frequentemente
- Pode competir por recursos com operacoes criticas

### 6. Multiplas Subscricoes Realtime

**Localizacao**: Varios arquivos

**Observacao**:
- `useConversations`: 3 subscricoes (conversations INSERT, UPDATE, messages INSERT)
- `ChatWindow`: 1 subscricao (messages INSERT por conversa)
- `useMessageNotifications`: 1 subscricao (messages INSERT global)

**Impacto potencial**: Overhead de conexoes WebSocket e processamento duplicado

---

## Secao Tecnica: Arquitetura de Mensagens

### Diagrama do Fluxo Atual

```text
+----------------+     +------------------+     +----------------+
|   Frontend     | --> |  Supabase Edge   | --> | Evolution API  |
|   ChatWindow   |     |  Functions       |     | (WhatsApp)     |
+----------------+     +------------------+     +----------------+
        ^                      |                       |
        |                      v                       |
        +------------ Supabase Realtime <--------------+
```

### Componentes Envolvidos no Envio

| Arquivo | Responsabilidade |
|---------|------------------|
| `ChatWindow.tsx` | UI, mensagem temporaria, chamada ao backend |
| `send-whatsapp-message/index.ts` | Resolucao de destinatario, envio via Evolution |
| `messages` (tabela) | Persistencia da mensagem |
| Supabase Realtime | Notificacao de nova mensagem |

### Componentes Envolvidos no Recebimento

| Arquivo | Responsabilidade |
|---------|------------------|
| `evolution-webhook/index.ts` | Processar webhooks da Evolution API |
| `contacts` (tabela) | Criar/buscar contato |
| `conversations` (tabela) | Criar/buscar conversa |
| `messages` (tabela) | Salvar mensagem recebida |
| `useConversations.ts` | Atualizar lista de conversas |
| `useInfiniteMessages.ts` | Atualizar mensagens da conversa aberta |

---

## Visao do Estado Atual

### Performance Dentro do Esperado

1. **Envio de mensagens**: 2-3 segundos e aceitavel para integracao via API externa
2. **Recebimento de mensagens**: 1-3 segundos via webhook e normal
3. **Edge Functions**: Boot time de 30-84ms e adequado
4. **Realtime**: Funcionando corretamente (logs mostram eventos sendo processados)

### Areas que Podem Contribuir para Percepcao de Lentidao

1. **Polling de 15 segundos**: Se o realtime falhar momentaneamente, usuario percebe atraso
2. **Queries N+1 para ultimas mensagens**: Pode causar lentidao ao carregar lista
3. **Cold starts**: Primeira mensagem apos periodo de inatividade e mais lenta
4. **Competicao de recursos**: Sync de avatares, realtime-sync, e operacoes normais compartilham recursos

---

## Proposta de Encaminhamento

### Nivel 1: Monitoramento (Sem alteracao de codigo)

Recomenda-se acompanhar os seguintes indicadores atraves dos logs existentes:

- Tempo medio de execucao do `evolution-webhook`
- Taxa de sucesso do Supabase Realtime (reconexoes)
- Frequencia de cold starts nas Edge Functions
- Tempo de resposta da Evolution API

### Nivel 2: Otimizacoes Conservadoras (Baixo risco)

Se aprovado pela gestao, podem ser implementadas melhorias pontuais:

1. **Reduzir polling quando realtime esta ativo**
   - Mudar de 15s para 60s quando realtime esta saudavel
   - Risco: Minimo, apenas reduz frequencia de backup

2. **Cache de canal da conversa**
   - Usar state existente ao inves de query antes de enviar
   - Risco: Minimo, dados ja estao disponiveis

3. **Batch de ultima mensagem via SQL**
   - Substituir N queries por 1 query com subquery
   - Risco: Baixo, melhora eficiencia

### Nivel 3: Otimizacoes Estruturais (Requer planejamento)

Para implementacao futura com testes adequados:

1. **Desnormalizar ultima mensagem na tabela conversations**
2. **Unificar subscricoes realtime**
3. **Implementar keep-alive para Edge Functions**

---

## Conclusao

A analise indica que o sistema esta funcionando dentro de parametros aceitaveis para uma integracao com API externa (WhatsApp via Evolution API). O tempo de 2-3 segundos para envio e 1-3 segundos para recebimento sao inerentes a arquitetura distribuida.

A percepcao de lentidao pode ser atribuida a:
- Expectativa de instantaneidade (usuarios acostumados com WhatsApp nativo)
- Momentos de pico com multiplos webhooks simultaneos
- Polling que nao captura mensagens nos intervalos entre fetches

As otimizacoes propostas no Nivel 2 podem melhorar a percepcao sem introduzir riscos, mas devem ser avaliadas e implementadas com acompanhamento adequado.
