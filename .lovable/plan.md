

## Plano Revisado: Visibilidade de Grupos no Inbox

### Diagnóstico Preciso

**Causa raiz identificada:** O processamento de grupos no webhook (`evolution-webhook`) NÃO atribui `company_id` ao criar contatos e conversas de grupo.

**Evidência direta no código (linhas 1543-1554 e 1583-1597):**
```typescript
// Contato de grupo criado SEM company_id
const { data: newGroupContact } = await supabase
  .from('contacts')
  .insert({
    name: groupName,
    metadata: { remoteJid: groupId, isGroup: true }
    // FALTA: company_id
  })

// Conversa de grupo criada SEM company_id
const { data: newConv } = await supabase
  .from('conversations')
  .insert({
    contact_id: groupContact.id,
    channel: 'whatsapp',
    // FALTA: company_id
  })
```

**Resultado:**
- 12 conversas de grupo existem com `company_id = NULL`
- O hook `useConversations.ts` filtra por `.eq('company_id', company.id)` (linha 107)
- Conversas sem `company_id` são excluídas do Inbox

**Importante:** A função `sync-all-groups` (usada manualmente) JÁ atribui `company_id` corretamente. O problema está APENAS no webhook que processa mensagens em tempo real.

---

### Cenários Afetados

| Cenário | Status Atual | Impacto |
|---------|--------------|---------|
| Grupos existentes sem `company_id` | 12 registros | Não aparecem no Inbox |
| Grupos existentes com `company_id` | 170 registros | Funcionam corretamente |
| Novos grupos (via webhook) | Serão criados sem `company_id` | Não aparecerão no Inbox |
| Conversas individuais (não grupos) | N/A | NÃO AFETADAS |

---

### Solução Proposta

**Princípio:** Intervenção mínima, focada exclusivamente no problema de grupos.

#### Parte 1: Correção do Webhook (Grupos Futuros)

**Arquivo:** `supabase/functions/evolution-webhook/index.ts`

**Alteração 1 - Obter `company_id` da instância ANTES de processar grupos:**

Adicionar nas linhas ~1520-1522 (logo após `if ((message as any)._isGroup)`):

```typescript
// Obter company_id da instância WhatsApp
const { data: instanceData } = await supabase
  .from('whatsapp_instances')
  .select('company_id')
  .eq('instance_name', webhook.instance)
  .maybeSingle();

const companyId = instanceData?.company_id;
if (!companyId) {
  console.log(`⚠️ Instance ${webhook.instance} has no company_id - skipping group`);
  continue;
}
```

**Alteração 2 - Adicionar filtro `company_id` na busca de contato de grupo (linha 1532):**

```typescript
// ANTES (problemático)
const { data: existingGroupContact } = await supabase
  .from('contacts')
  .select('*')
  .contains('metadata', { remoteJid: groupId })
  .limit(1)
  .single();

// DEPOIS (corrigido)
const { data: existingGroupContact } = await supabase
  .from('contacts')
  .select('*')
  .eq('company_id', companyId)
  .contains('metadata', { remoteJid: groupId })
  .limit(1)
  .maybeSingle();
```

**Alteração 3 - Adicionar `company_id` na criação de contato de grupo (linhas 1545-1552):**

```typescript
const { data: newGroupContact } = await supabase
  .from('contacts')
  .insert({
    name: groupName,
    company_id: companyId,  // ADIÇÃO
    metadata: { remoteJid: groupId, isGroup: true, groupType: 'whatsapp' }
  })
```

**Alteração 4 - Adicionar `company_id` na criação de conversa de grupo (linhas 1583-1595):**

```typescript
const { data: newConv } = await supabase
  .from('conversations')
  .insert({
    contact_id: groupContact.id,
    company_id: companyId,  // ADIÇÃO
    channel: 'whatsapp',
    status: 'open',
    bot_active: false,
    metadata: { remoteJid: groupId, isGroup: true, instanceName: webhook.instance }
  })
```

---

#### Parte 2: Recuperação de Grupos Existentes

**Abordagem:** Atualizar o `company_id` dos 12 registros órfãos diretamente, sem deleção ou migração.

**Opção A - Executar via SQL (recomendado, mais simples):**

```sql
-- Atualizar contatos de grupo sem company_id
UPDATE contacts c
SET company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
WHERE c.company_id IS NULL
  AND c.metadata->>'isGroup' = 'true';

-- Atualizar conversas de grupo sem company_id  
UPDATE conversations conv
SET company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
WHERE conv.company_id IS NULL
  AND conv.metadata->>'isGroup' = 'true';
```

**Opção B - Edge Function (se preferir automação):**

Uma função simples que:
1. Identifica contatos/conversas de grupo com `company_id = NULL`
2. Atualiza o `company_id` para o valor da VIAINFRA
3. NÃO deleta, NÃO migra, NÃO modifica outros campos

---

### O Que NÃO Será Alterado

| Componente | Impacto |
|------------|---------|
| `useConversations.ts` (frontend) | NENHUM - filtro por company_id já funciona |
| Conversas individuais (não grupos) | NENHUM - código diferente |
| Ordenação do Inbox | NENHUM - lógica preservada |
| Sincronização em tempo real | NENHUM - apenas adiciona company_id |
| Canais que não são WhatsApp | NENHUM - código separado |
| Limite de 200 conversas | Não precisa alterar - os 12 grupos estão bem abaixo |

---

### Garantias

1. **Escopo restrito:** Apenas o bloco de código de processamento de grupos no webhook será modificado
2. **Sem deleção de dados:** Nenhum registro será excluído
3. **Sem migração de mensagens:** Mensagens permanecem nas conversas originais
4. **Sem merge de registros:** Registros duplicados (se existirem) permanecerão separados
5. **Retrocompatibilidade:** Grupos que já funcionam continuarão funcionando
6. **Sem risco para conversas individuais:** O código de grupos é um bloco `if` separado que termina com `continue`

---

### Verificação Pós-Implementação

Após aplicar as alterações:

1. Os 12 grupos órfãos aparecerão no Inbox imediatamente após a atualização SQL
2. Qualquer novo grupo criado via webhook terá `company_id` automaticamente
3. O grupo "EQM 9590 OM 364VI 21/2026" ficará visível (já existe com company_id, apenas o duplicado órfão será atualizado)

---

### Resumo de Arquivos Afetados

| Arquivo | Tipo de Alteração | Linhas Afetadas |
|---------|-------------------|-----------------|
| `supabase/functions/evolution-webhook/index.ts` | Adição de 4 blocos pequenos | ~1520-1600 |
| Banco de dados | UPDATE em 12 contatos e 12 conversas | N/A |

**Total de linhas de código modificadas:** ~15-20 linhas (apenas adições, sem remoções)

