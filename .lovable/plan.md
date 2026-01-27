

## Implementação: Correção do Nome de Grupos no Inbox

### Alterações a Serem Realizadas

---

### Parte 1: Correção do Webhook (Grupos Futuros)

**Arquivo:** `supabase/functions/evolution-webhook/index.ts`

**Localização:** Linhas 1522-1527

**De:**
```typescript
if ((message as any)._isGroup) {
  const groupId = remoteJid;
  const groupName = contactName || `Grupo ${groupId.split('@')[0]}`;
  const participantName = message.pushName || 'Participante';
  
  console.log(`📢 Processing GROUP message from ${participantName} in group ${groupId}`);
```

**Para:**
```typescript
if ((message as any)._isGroup) {
  const groupId = remoteJid;
  const participantName = message.pushName || 'Participante';
  
  console.log(`📢 Processing GROUP message from ${participantName} in group ${groupId}`);
  
  // Buscar nome REAL do grupo via API do Evolution (não usar pushName que é o nome do participante)
  let groupName = `Grupo ${groupId.split('@')[0]}`; // fallback
  
  try {
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';
    
    if (evolutionUrl && evolutionKey) {
      const groupInfoResponse = await fetch(
        `${evolutionUrl}/group/findGroupInfos/${webhook.instance}?groupJid=${groupId}`,
        { 
          headers: { 'apikey': evolutionKey },
          signal: AbortSignal.timeout(5000) // timeout de 5 segundos
        }
      );
      
      if (groupInfoResponse.ok) {
        const groupInfo = await groupInfoResponse.json();
        if (groupInfo?.subject) {
          groupName = groupInfo.subject;
          console.log(`📢 Group name from API: ${groupName}`);
        }
      }
    }
  } catch (error) {
    console.log(`⚠️ Could not fetch group name from API, using fallback: ${groupName}`);
  }
```

---

### Parte 2: Correção de Grupos Existentes (SQL)

**Nova migração:** `supabase/migrations/20260127160500_fix_group_names.sql`

```sql
-- Corrigir nomes de grupos que estão com "Via Infra" (nome do participante)
-- usando o nome correto de grupos duplicados que já existem

WITH correct_names AS (
  SELECT 
    metadata->>'remoteJid' as jid,
    name
  FROM contacts
  WHERE metadata->>'isGroup' = 'true'
    AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
    AND name != 'Via Infra'
    AND name IS NOT NULL
    AND name != ''
)
UPDATE contacts c
SET name = cn.name, updated_at = now()
FROM correct_names cn
WHERE c.metadata->>'remoteJid' = cn.jid
  AND c.name = 'Via Infra'
  AND c.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND c.metadata->>'isGroup' = 'true';
```

---

### Resumo

| Componente | Alteração | Impacto |
|------------|-----------|---------|
| Webhook | Buscar nome via API Evolution | Grupos futuros com nome correto |
| SQL Migration | UPDATE em contatos com nome "Via Infra" | 9 grupos existentes corrigidos |

### Garantias

- Apenas contatos de grupo são afetados
- Contatos individuais permanecem inalterados
- Nenhuma exclusão ou migração de dados
- Ordenação do Inbox preservada
- Fallback seguro se API não responder (usa nome genérico)

