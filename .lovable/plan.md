

## Novos Modulos: Lista de Transmissao e Ligacoes WhatsApp

Dois novos modulos serao criados e adicionados ao sidebar com icone de cadeado indicando "Em Desenvolvimento".

---

### 1. Lista de Transmissao (Broadcast Lists)

Modulo para envio de mensagens em massa via WhatsApp Cloud API.

**Tela principal incluira:**
- Listagem de listas de transmissao criadas (nome, quantidade de contatos, ultima utilizacao)
- Botao para criar nova lista de transmissao
- Selecao de contatos do CRM para adicionar a lista
- Composer de mensagem com suporte a templates (exigencia da WhatsApp Cloud API)
- Historico de envios com status de entrega por destinatario
- Metricas: enviadas, entregues, lidas, falhas

**Baseado na WhatsApp Cloud API:**
- Endpoint `POST /{phone_number_id}/messages` com envio individual para cada contato da lista
- Uso obrigatorio de Message Templates pre-aprovados para iniciar conversas
- Controle de rate limiting (80 mensagens/segundo no tier padrao)

---

### 2. Ligacoes WhatsApp (WhatsApp Calls)

Modulo de chamadas de voz/video via WhatsApp com discador e registro.

**Tela principal incluira:**
- Discador numerico (dial pad) para iniciar chamadas
- Lista de contatos rapidos para ligar com 1 clique
- Historico de chamadas (recebidas, realizadas, perdidas)
- Duracao, data/hora, status de cada chamada
- Filtros por tipo (entrada/saida), periodo, contato

**Baseado na WhatsApp Cloud API:**
- A Cloud API atualmente nao suporta iniciar chamadas programaticamente
- O modulo registrara chamadas recebidas via webhook `CALL` do Evolution API
- O discador sera preparado como interface, sinalizando que a funcionalidade de iniciar chamadas depende de atualizacao futura da API
- Registro automatico de chamadas recebidas a partir dos eventos do webhook

---

### 3. Integracao no Sidebar e Rotas

Ambos os itens aparecerao no sidebar com um badge de cadeado e texto "Em breve" ao lado, sinalizando que estao em desenvolvimento.

**Novos itens no menu:**
- "Transmissao" com icone `Radio` (lucide) + cadeado
- "Ligacoes" com icone `Phone` (lucide) + cadeado

**Posicionamento:** Abaixo de "Relacionamento" e antes de "Agentes IA"

---

### Detalhes Tecnicos

| Arquivo | Acao |
|---|---|
| `src/pages/app/BroadcastLists.tsx` | Nova pagina - lista de transmissao com composer, selecao de contatos, historico |
| `src/pages/app/WhatsAppCalls.tsx` | Nova pagina - discador, historico de chamadas, registros |
| `src/components/app/broadcast/BroadcastListForm.tsx` | Formulario de criacao/edicao de lista |
| `src/components/app/broadcast/BroadcastComposer.tsx` | Composer de mensagem com templates |
| `src/components/app/broadcast/BroadcastHistory.tsx` | Historico de envios |
| `src/components/app/calls/DialPad.tsx` | Componente de discador numerico |
| `src/components/app/calls/CallHistory.tsx` | Historico de chamadas |
| `src/components/app/calls/CallRecord.tsx` | Item individual de registro de chamada |
| `src/components/app/Sidebar.tsx` | Adicionar 2 novos itens com badge "Em breve" e cadeado |
| `src/components/app/MobileNavigation.tsx` | Adicionar itens no menu "Mais" do mobile |
| `src/App.tsx` | Registrar rotas `/broadcast` e `/calls` |
| `src/types/broadcast.ts` | Tipos para listas de transmissao |
| `src/types/calls.ts` | Tipos para registros de chamadas |

**Badge "Em Desenvolvimento":** Cada item no sidebar tera um badge customizado com icone de cadeado e texto "Em breve" em cor amber/amarela, diferente dos badges de plano existentes, para deixar claro que sao funcionalidades em construcao.

**Paginas:** Ao acessar, o usuario vera a interface completa do modulo, mas com um banner no topo informando "Modulo em desenvolvimento - disponivel em breve" para contextualizar.

