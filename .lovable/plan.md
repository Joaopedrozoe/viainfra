
## Habilitar Alternancia de Empresa para Logins Diferentes

### Problema

O `AuthContext` carrega perfis apenas por `user_id` da sessao ativa. Como Joicy e Suelem tem user_ids diferentes para VIAINFRA e VIALOGISTIC, o sistema so encontra 1 perfil e nao mostra o `CompanySwitcher`.

### Solucao: Tabela `company_access`

Criar uma tabela de mapeamento que indica quais empresas um usuario pode acessar, independente de ter perfil com o mesmo `user_id`.

### Mudancas

**1. Criar tabela `company_access`**

```sql
CREATE TABLE public.company_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE(user_id, company_id)
);
```

Inserir registros para Joicy e Suelem mapeando seus user_ids VIAINFRA para a VIALOGISTIC:

| user_id (VIAINFRA login) | company_id (VIALOGISTIC) |
|---|---|
| df98e045... (Joicy) | e3ad9c68... |
| 2dbb8e79... (Suelem) | e3ad9c68... |

**2. Modificar `AuthContext.tsx`**

Apos carregar os perfis por `user_id`, tambem consultar `company_access` para descobrir empresas adicionais. Montar a lista de empresas disponiveis combinando:
- Empresas dos perfis carregados (comportamento atual)
- Empresas da tabela `company_access`

Modificar `switchCompany` para que, quando a empresa alvo nao tem perfil com o mesmo `user_id`, busque o perfil por `company_id` e `name` (ou via dados retornados pela edge function).

**3. Modificar `verify-company-credentials` (Edge Function)**

Alem de verificar credenciais, retornar o perfil completo do usuario autenticado na empresa alvo (id, name, email, role, permissions). Esses dados serao usados pelo `AuthContext` para montar o contexto da empresa sem precisar do mesmo `user_id`.

**4. Modificar `CompanySwitcher.tsx`**

O componente ja esta correto -- ele recebe a lista de empresas como prop. A mudanca e apenas na origem dos dados (AuthContext).

**5. Modificar `Sidebar.tsx`**

Atualizar a construcao da lista `companies` para incluir empresas da `company_access`, nao apenas dos `userProfiles`.

### Fluxo atualizado

```text
Joicy faz login (atendimento@viainfra.com.br)
    |
    v
AuthContext carrega perfis (1 perfil VIAINFRA)
    |
    v
AuthContext consulta company_access -> encontra VIALOGISTIC
    |
    v
CompanySwitcher mostra: [VIAINFRA, VIALOGISTIC]
    |
    v
Joicy clica em VIALOGISTIC (nao verificada na sessao)
    |
    v
CompanyAuthModal abre com branding VIALOGISTIC
    |
    v
Joicy insere joicy.souza@vialogistic.com.br + senha
    |
    v
verify-company-credentials valida e retorna perfil completo
    |
    v
AuthContext recebe perfil e faz switch -> sessao verificada
    |
    v
Proximas trocas sao instantaneas (sessionStorage)
```

### Arquivos modificados

| Arquivo | Acao |
|---|---|
| Migracao SQL | Criar tabela `company_access` + inserir registros |
| `src/contexts/auth/AuthContext.tsx` | Consultar `company_access` + switchCompany com perfil externo |
| `src/contexts/auth/types.ts` | Adicionar `accessibleCompanies` ao AuthContextType |
| `supabase/functions/verify-company-credentials/index.ts` | Retornar perfil completo |
| `src/components/app/Sidebar.tsx` | Usar `accessibleCompanies` para lista do switcher |
| `src/integrations/supabase/types.ts` | Adicionar tipo da tabela `company_access` |
