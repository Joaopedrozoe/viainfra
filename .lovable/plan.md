# Plano de Otimização: Instantaneidade Percebida no Inbox

## Status: ✅ IMPLEMENTADO (30/01/2026)

---

## Correções Aplicadas

### 1. ✅ Correção do Status Inicial do Realtime
**Arquivo**: `src/hooks/useConversations.ts`

**Problema**: A variável `realtimeConnected` era inicializada como `false`, causando polling desnecessário a cada 15s mesmo quando a conexão estava saudável.

**Solução Implementada**:
- Inicializar `realtimeConnected = true` (assume conectado até erro explícito)
- Adicionar flag `connectionConfirmed` para rastrear confirmação
- Implementar timeout de 10s para detectar falha real de conexão
- Marcar como desconectado apenas em erros explícitos (CHANNEL_ERROR, TIMED_OUT, CLOSED)
- Remover referências a `lastRealtimeEvent` (lógica obsoleta)

### 2. ✅ Callback de Status no ChatWindow
**Arquivo**: `src/components/app/ChatWindow.tsx`

**Problema**: A subscription de mensagens da conversa aberta não tinha callback de status.

**Solução Implementada**:
- Adicionar callback `.subscribe((status) => {...})` com logs claros
- Log de sucesso: `✅ ChatWindow realtime CONNECTED for conversation: {id}`
- Log de alerta: `⚠️ ChatWindow realtime status: {status}`

### 3. ✅ Scroll Instantâneo
**Arquivo**: `src/components/app/ChatWindow.tsx`

**Problema**: O scroll para novas mensagens usava `behavior: "smooth"`, adicionando 200-300ms de delay visual.

**Solução Implementada**:
- Mudar para `behavior: "auto"` para scroll instantâneo
- Mantém o `requestAnimationFrame` para garantir que o DOM está atualizado

---

## Métricas de Sucesso Esperadas

### Console Logs Após Correções

**Esperado**:
```text
📡 Realtime status: SUBSCRIBED
✅ Realtime CONNECTED - instant updates enabled
✅ ChatWindow realtime CONNECTED for conversation: {id}
```

**Não deve mais aparecer**:
```text
🔄 Fast poll (realtime disconnected)
```

### Tempos de Resposta

| Ação | Antes | Depois |
|------|-------|--------|
| Receber mensagem | 0.5-15s (variável) | <500ms (consistente) |
| Scroll para nova mensagem | ~300ms | <16ms |
| Detecção de conexão | 15s (polling) | Instantânea (realtime) |

---

## Limitações Conhecidas (Irredutíveis)

### Envio de Mensagens: 2-3 segundos
Este tempo é inerente à comunicação com a Evolution API e servidores do WhatsApp. Não pode ser reduzido significativamente.

### Dependência da Conexão de Internet
A experiência de tempo real depende da qualidade da conexão do usuário com o Supabase Realtime.

---

## Próximos Passos Opcionais (Nível 3)

1. **Otimização da Edge Function `realtime-sync`**
   - Tempo atual: 21-22 segundos
   - Meta: 5-7 segundos
   - Ações: Filtrar JIDs inválidos, batch updates, reduzir limit de mensagens

2. **Feedback Visual Aprimorado para Envio**
   - Animação de "digitando..." durante envio
   - Indicador de status de entrega (✓, ✓✓)

3. **Reconexão Automática do Realtime**
   - Detectar desconexão e reconectar automaticamente
   - Exibir indicador visual de status de conexão
