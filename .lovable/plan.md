

## Criação de Credenciais VIALOGISTIC + Fluxo de Autenticação por Empresa

### Resumo

Criar contas de login separadas para Joicy e Suelem no contexto VIALOGISTIC, e implementar um fluxo onde ao alternar de empresa pela primeira vez, uma tela de login com identidade visual da VIALOGISTIC aparece exigindo autenticação. Após autenticar, a troca entre empresas é livre na sessão.

### O que sera feito

**1. Criar credenciais Supabase Auth para VIALOGISTIC**

Criar dois novos usuarios no Supabase Auth:
- `joicy.souza@vialogistic.com.br` / `atendimento@26`
- `suelem.souza@vialogistic.com.br` / `atendimento@26`

Atualizar os perfis VIALOGISTIC existentes (criados na migracao anterior) para apontar para os novos `user_id`s, mantendo os perfis VIAINFRA inalterados.

**2. Edge Function `verify-company-credentials`**

Uma edge function que recebe email + senha e verifica as credenciais server-side usando `supabase.auth.signInWithPassword` em um cliente separado do admin. Retorna sucesso/falha SEM alterar a sessao do cliente (a verificacao e feita no servidor).

Isso garante que a sessao atual do atendente na VIAINFRA nao e interrompida.

**3. Componente `CompanyAuthModal`**

Novo componente modal com identidade visual dinamica baseada na empresa destino:
- Logo VIALOGISTIC (`/lovable-uploads/vialogistic-logo.png`)
- Campos de email e senha
- Botao "Autenticar" com cores amarelas (tema VIALOGISTIC)
- Exibido APENAS na primeira tentativa de troca para uma empresa nao verificada

**4. Fluxo de troca de empresa atualizado**

Modificacoes no `AuthContext.tsx` e `CompanySwitcher.tsx`:

```text
Usuario clica em "VIALOGISTIC" no CompanySwitcher
       |
       v
Empresa ja verificada nesta sessao? (sessionStorage)
       |
  SIM -+-> switchCompany() normal (troca instantanea)
       |
  NAO -+-> Abre CompanyAuthModal com branding VIALOGISTIC
              |
              v
        Usuario insere email + senha VIALOGISTIC
              |
              v
        Chama edge function verify-company-credentials
              |
         SUCESSO -> Salva no sessionStorage -> switchCompany()
         FALHA -> Exibe erro "Credenciais invalidas"
```

**5. Armazenamento de verificacao**

Usar `sessionStorage` (nao `localStorage`) para guardar as empresas verificadas. Isso significa que ao fechar o navegador, a verificacao expira e sera necessario autenticar novamente na proxima sessao -- comportamento seguro e esperado.

---

### Arquivos criados/modificados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/verify-company-credentials/index.ts` | **Criar** -- Edge function de verificacao |
| `src/components/app/CompanyAuthModal.tsx` | **Criar** -- Modal de login por empresa |
| `src/contexts/auth/AuthContext.tsx` | **Modificar** -- Adicionar logica de verificacao no `switchCompany` |
| `src/components/app/CompanySwitcher.tsx` | **Modificar** -- Integrar modal de autenticacao |
| `src/components/app/Sidebar.tsx` | **Modificar** -- Passar props do modal |
| Migracao SQL | **Criar** -- Setup users via edge function |

### Detalhes tecnicos

**Edge Function `verify-company-credentials`:**
- Recebe `{ email, password, targetCompanyId }`
- Cria um cliente Supabase temporario e chama `signInWithPassword`
- Verifica se o usuario autenticado tem perfil na empresa alvo
- Retorna `{ success: true }` ou `{ success: false, error: "..." }`
- NAO afeta a sessao do cliente chamador

**CompanyAuthModal:**
- Props: `isOpen`, `onClose`, `onSuccess`, `targetCompany`
- Logo e cores dinamicas baseadas em `targetCompany.name`
- Chama a edge function e dispara `onSuccess(companyId)` ao verificar

**AuthContext changes:**
- `switchCompany` agora aceita callback `onRequireAuth` 
- Ou: novo estado `pendingCompanySwitch` + `verifiedCompanies` Set
- Metodo `verifyCompanyAccess(companyId)` que checa sessionStorage

**Criacao de auth users:**
- Sera feita via a edge function `setup-users` existente ou via migracao com `supabase.auth.admin.createUser`

