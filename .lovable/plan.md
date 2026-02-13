

## Correcao: CompanySwitcher nao aparece para Joicy

### Causa Raiz

A politica RLS da tabela `companies` so permite visualizar empresas onde o usuario tem um **perfil**:

```
Users can view their own company:
  id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
```

Joicy tem perfil apenas na VIAINFRA. Quando o `AuthContext` consulta `company_access` e encontra a VIALOGISTIC, ele tenta buscar os dados da empresa na tabela `companies` -- mas o RLS bloqueia porque Joicy nao tem perfil la.

O resultado: `companiesError` ocorre na linha 75, e o fallback na linha 79 cria uma entrada com nome generico "Empresa". Mas o problema real e que o `CompanySwitcher` so aparece quando `companies.length > 1` no Sidebar -- e essa condicao pode nao estar sendo satisfeita se o erro silencioso impede a montagem correta da lista.

### Solucao

**1. Adicionar politica RLS na tabela `companies`** (Migracao SQL)

Permitir que usuarios vejam empresas listadas na sua `company_access`:

```sql
CREATE POLICY "Users can view companies via company_access"
  ON public.companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM public.company_access
      WHERE user_id = auth.uid()
    )
  );
```

**2. Remover cast `as any` no AuthContext** (Limpeza)

Na linha 41, remover o `as any` de `company_access` ja que o tipo existe no arquivo de tipos gerado.

### Arquivos Modificados

| Arquivo | Acao |
|---|---|
| Migracao SQL | Adicionar politica RLS em `companies` para `company_access` |
| `src/contexts/auth/AuthContext.tsx` | Remover `as any` na query de `company_access` (linha 41) |

### Resultado Esperado

Apos a migracao, quando Joicy fizer login:
1. `company_access` retorna VIALOGISTIC (ja funciona)
2. Query em `companies` para buscar nome/logo da VIALOGISTIC **agora permitida** pelo novo RLS
3. `accessibleCompanies` tera 2 empresas
4. `CompanySwitcher` aparece no Sidebar

