

## Plano: Reverter o Bypass de Emergencia

Remover todo o codigo de bypass de emergencia do `AuthContext.tsx`, voltando a autenticacao normal do Supabase.

### O que sera feito

1. Remover a constante `EMERGENCY_BYPASS` e todos os objetos hardcoded (`EMERGENCY_USER`, `EMERGENCY_PROFILE`, `EMERGENCY_COMPANY`)
2. Remover os blocos `if (EMERGENCY_BYPASS)` dentro de `initializeAuth()` e `signIn()`
3. O arquivo volta ao estado original, com autenticacao 100% via Supabase

### Arquivo modificado

- `src/contexts/auth/AuthContext.tsx` -- remocao de ~50 linhas adicionadas pelo bypass

### Resultado

A autenticacao volta a funcionar normalmente via Supabase Auth. Quando voce resolver a questao do egress no Supabase, o login e o inbox voltarao a funcionar.

