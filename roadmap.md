# Roadmap

## Current request — transmission screen failure
- [x] Guard delivery metadata and handle failed history requests without interrupting the screen.
- [x] Five focused regression tests passed.
- [ ] Reproduce the reported screen failure authenticated: external Supabase has no available browser session; public browser check reached login without errors and captured logs do not identify the reported exception.

## Current request — Vialogistic
- [x] Navigation: unique subscriptions, stale-response guards, deferred auth callbacks and removed nested buttons.
- [x] Expand message composer vertically.
- [x] Preserve customized contact names; prior metadata contains numeric names, not evidence for safe rollback.
- [x] Investigate template failures and show current error/report instructions; recent Vialogistic morning templates read successfully.
- [x] Implement image-template broadcasts, recipient import, test, validation, progress and history.
- [x] Focused tests: 9 passed; all six images load.
- [ ] Six new templates: Meta currently returns only existing text templates; cannot enable image sending until returned by correct WABA.
- [ ] Authenticated navigation and end-to-end broadcast delivery: external unmanaged Supabase has no reusable browser session; no real destination authorized for agent tests.

- [x] 1. Grupos (API oficial): aba Grupos, ícone, painel de informações, criar grupo, participantes, link de convite, configurações, sair; edge function whatsapp-group-action
- [x] 2. Anexos: arrastar/colar, múltiplos arquivos, validação limites Meta, localização, cartão de contato
- [x] 3. Contatos/nova conversa: RLS multi-empresa (company_access) + mensagem de erro real
- [x] 4. Ligações: claim_call (primeiro atende, some para os demais), ring_deadline, resiliência realtime, "Atendida por"
- [x] 5. IA Vivi (Gemini direto): tabelas, funções vivi-analyze-conversation/vivi-backfill, cron 5 min, página Agentes (insights, aprendizado, personalidade), avatares por empresa
- [x] 5b. IA ativa via Lovable AI (troca para Gemini direto quando GEMINI_API_KEY for configurada)
- [x] Typecheck OK; funções implantadas
- [ ] Validação autenticada no navegador — bloqueada (Supabase externo, sem sessão de teste); validar com o usuário logado

- [x] Encaminhar: lista completa (todas conversas + agenda)
- [x] Template Vialogistic pós-regularização (verificado: último envio barrado por 131049, não pagamento)
- [x] Usar a imagem enviada (Cloud API + marcas) como ícone do aplicativo instalado, preservando o favicon do site.

## Current request — template images
- [x] Bind the six Vialogistic templates to their corresponding images in both pickers; clear manual images when switching unrelated templates.
- [ ] User validation of template switching and actual delivery; no real messages sent by the agent.

## Current request — unsupported WhatsApp lookup
- [x] Handle the explicit unsupported-method response without falsely confirming WhatsApp existence or blocking format-valid sends.
- [ ] User validates the verification and broadcast flow; agent sends no real messages.
