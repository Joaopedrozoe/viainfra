

## Plano: Bypass Temporario de Autenticacao (Modo Emergencia)

### O que sera feito

Criar um **modo emergencia** no `AuthContext.tsx` que, quando ativado por uma flag, pula completamente a autenticacao do Supabase e carrega dados de perfil/empresa hardcoded, permitindo que qualquer tentativa de login entre direto no sistema.

### Como funciona

1. Uma constante `EMERGENCY_BYPASS = true` no topo do `AuthContext.tsx` controla o modo
2. Quando ativa, o `signIn` ignora o Supabase Auth e seta diretamente os dados do usuario admin (Anthony Suporte / adm@viainfra.com.br) com a empresa Viainfra
3. O `initializeAuth` tambem carrega esses dados automaticamente (sem precisar de sessao)
4. Todo o resto do app funciona normalmente pois recebe os mesmos tipos de dados

### Limitacoes conhecidas

- Todos os usuarios entrarao como "Anthony Suporte" (admin) -- nao ha distincao de atendente
- O Supabase Database/Realtime **tambem esta bloqueado**, entao o Inbox pode nao carregar conversas reais (depende do mesmo egress)
- Este modo so resolve o login; se as queries de conversas/mensagens tambem falharem, o Inbox ficara vazio

### Rollback

Para reverter, basta mudar `EMERGENCY_BYPASS = true` para `EMERGENCY_BYPASS = false` no topo do arquivo `AuthContext.tsx`. Nenhum outro arquivo sera alterado.

### Detalhes tecnicos

**Arquivo modificado:** `src/contexts/auth/AuthContext.tsx`

Adicionar no topo do arquivo:
- Constante `EMERGENCY_BYPASS = true`
- Objeto `EMERGENCY_USER_DATA` com dados hardcoded do admin e empresa Viainfra (IDs reais do banco)

Modificar:
- `initializeAuth()`: se bypass ativo, setar dados direto sem chamar Supabase
- `signIn()`: se bypass ativo, aceitar qualquer email/senha e setar dados direto
- `signOut()`: funciona normalmente (limpa estado)

Dados usados:
- user_id: `6a1713fa-31e0-42e8-beae-805c3e589f42`
- profile_id: `175cfece-3a16-42c7-b4e4-414f825639fa`
- company_id: `da17735c-5a76-4797-b338-f6e63a7b3f8b`
- Empresa: Viainfra, plano enterprise, role admin

