

## Audit Completo: Violações da Regra Mestra de Isolamento de Instâncias

### Problema Central

A "Regra Mestra" diz: **apenas instâncias com VIAINFRA no nome para VIAINFRA, apenas com VIALOGISTIC no nome para VIALOGISTIC**. Porém, múltiplos pontos do sistema violam essa regra:

### 1. Instâncias no banco com company_id errado

Atualmente no banco, LEGACYTATTOO, JUNIOCORRETOR_ALUGUEL, JUNIOCORRETOR_VENDAS, LEGACYTATTOO_TEST e "Via Infra " estão todas com `company_id = VIAINFRA`. Isso faz com que o `realtime-sync` (que processa TODAS as instâncias com status `open`) importe dados dessas instâncias para o inbox da VIAINFRA.

**Ação**: Desassociar todas essas instâncias (set `company_id = NULL`) para que nenhum processo automático as vincule a VIAINFRA.

### 2. `realtime-sync/index.ts` - ZERO filtro de nome

Linha 37-40: busca TODAS as instâncias conectadas sem filtrar por prefixo. Qualquer instância com `status = open` e `company_id` definido é processada.

**Ação**: Adicionar filtro estrito: só processar instâncias cujo `instance_name` contenha "VIAINFRA" ou "VIALOGISTIC" (case-insensitive).

### 3. `evolution-webhook/index.ts` - JUNIORCORRETOR na lista

Linha 6: `ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'viainfraoficial', 'Via Infra ', 'Via Infra', 'JUNIORCORRETOR']`

**Ação**: Trocar lista hardcoded por validação dinâmica: aceitar apenas instâncias contendo "VIAINFRA" no nome.

### 4. `evolution-instance/index.ts` - Lista restritiva demais

Linha 5: `ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'viainfraoficial']` — bloqueia operações em instâncias VIALOGISTIC.

**Ação**: Trocar por validação dinâmica: aceitar qualquer instância contendo "VIAINFRA" ou "VIALOGISTIC".

### 5. `import-chats/index.ts` - Lista hardcoded

Linha 4: `ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'viainfraoficial']` — bloqueia importação para VIALOGISTIC.

**Ação**: Mesma correção dinâmica.

### 6. `full-history-import/index.ts` - Lista hardcoded

Linha 16: `ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'viainfraoficial']`

**Ação**: Mesma correção dinâmica.

### 7. `sync-all-groups/index.ts` - JUNIORCORRETOR na lista

Linha 9: `ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'JUNIORCORRETOR']`

**Ação**: Mesma correção dinâmica.

### 8. `sync-profile-pictures/index.ts` - JUNIORCORRETOR na lista

Linha 10: `AUTHORIZED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'JUNIORCORRETOR']`

**Ação**: Mesma correção dinâmica.

### 9. `process-message-queue/index.ts` - Lista hardcoded

Linha 54: `AUTHORIZED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL']`

**Ação**: Trocar por busca da instância pela `company_id` da conversa (como já foi feito em `send-whatsapp-message`).

### 10. Dados sujos no banco

Conversas criadas por LEGACYTATTOO e JUNIOCORRETOR_ALUGUEL existem no banco com `company_id = VIAINFRA`. São ~123 conversas que não pertencem à VIAINFRA.

**Ação**: Deletar mensagens e conversas cujo metadata.instanceName seja LEGACYTATTOO, JUNIOCORRETOR_ALUGUEL, JUNIOCORRETOR_VENDAS, ou LEGACYTATTOO_TEST.

---

### Resumo das Mudanças

| Componente | Mudança |
|-----------|---------|
| **DB: whatsapp_instances** | Set `company_id = NULL` para LEGACYTATTOO, JUNIOCORRETOR_ALUGUEL, JUNIOCORRETOR_VENDAS, LEGACYTATTOO_TEST, "Via Infra " |
| **DB: cleanup** | Deletar conversas e mensagens com instanceName de instâncias não-VIA |
| **realtime-sync** | Filtrar por prefixo VIAINFRA/VIALOGISTIC no nome |
| **evolution-webhook** | Remover lista hardcoded, aceitar apenas instâncias com "VIAINFRA" |
| **evolution-instance** | Aceitar instâncias com "VIAINFRA" ou "VIALOGISTIC" |
| **import-chats** | Mesma validação dinâmica |
| **full-history-import** | Mesma validação dinâmica |
| **sync-all-groups** | Mesma validação dinâmica |
| **sync-profile-pictures** | Mesma validação dinâmica |
| **process-message-queue** | Buscar instância por company_id da conversa |

### Padrão Unificado

Todas as listas hardcoded serão substituídas por uma função helper:

```typescript
function isAllowedInstance(name: string): boolean {
  const upper = name.toUpperCase();
  return upper.includes('VIAINFRA') || upper.includes('VIALOGISTIC');
}
```

Isso garante que qualquer instância futura (ex: VIAINFRA2, VIALOGISTIC_TESTE) seja aceita automaticamente, e qualquer instância externa (LEGACYTATTOO, JUNIORCORRETOR, etc.) seja rejeitada em todos os pontos do sistema.

