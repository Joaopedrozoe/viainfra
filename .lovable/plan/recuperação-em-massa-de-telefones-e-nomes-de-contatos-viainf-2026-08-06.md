# Recuperação em massa de telefones e nomes de contatos (VIAINFRA + VIALOGISTIC)

## Situação atual (medida agora no banco)

| Empresa | Contatos | Sem telefone | Nome que é só número |
|---|---|---|---|
| VIAINFRA | 4.387 | 3.163 | 293 |
| VIALOGISTIC | 529 | 237 | 106 |

As planilhas enviadas trazem, por telefone, `Nome de exibição público` e `Nome salvo` — 5.665 linhas em `All_Country_3.xlsx` e 391 em `All_Country_2.xlsx`. São a fonte ideal para os dois problemas: telefone→nome e nome→telefone.

O caso do Roberto já provou o mecanismo: cruzando `external_id` das mensagens, o contato duplicado sem telefone tinha 22 mensagens em comum com uma conversa cujo contato tem `5511978438886`.

## Etapa 1 — Carregar as planilhas como base de referência
Importar as duas planilhas para uma tabela de referência (telefone normalizado, nome de exibição, nome salvo, é_meu_contato, origem/arquivo). Serve de dicionário para todos os passes seguintes e fica disponível para novas cargas.

## Etapa 2 — Recuperar telefones (em ordem de confiança, tudo com simulação antes)
1. **Cruzamento por id de mensagem** (determinístico): mensagens do contato sem telefone que já existem em outra conversa com telefone/JID → herda telefone e JID. Foi o que resolveu o Roberto.
2. **JID / LID**: telefone extraído de `metadata.remoteJid` e de `lid_phone_mapping`.
3. **Planilha por nome**: nome do contato casado com `Nome salvo`/`Nome de exibição` (normalizando acentos, caixa, pontuação e sufixos). Só aplica quando o nome bate em **um único** telefone.
4. **Telefone dentro do conteúdo**: números presentes em vCard/mensagens da própria conversa, validados com o padrão brasileiro.
Cada passe roda primeiro em modo simulação e eu te apresento a lista (contato → telefone → passe → evidência) antes de aplicar.

## Etapa 3 — Corrigir nomes que são telefone
Para os 399 contatos com nome numérico: buscar o nome real na planilha (por telefone), depois na lista de contatos/chats da instância (pushName/verifiedName), depois no `pushName` gravado nas mensagens recebidas. Preferência pelo `Nome salvo` da planilha, que é o nome da agenda da empresa. Nome numérico só permanece quando não há nenhuma fonte.

## Etapa 4 — Mesclar duplicados revelados pela recuperação
Quando dois contatos passarem a ter o mesmo telefone na mesma empresa: manter um só, migrar mensagens que não existirem no destino (comparando id do WhatsApp), preservar o nome mais informativo e apontar as conversas para o contato mantido. Mensagem sem par nunca é descartada.

## Etapa 5 — Relatório
Ao final, um relatório em planilha com: telefones recuperados por passe, nomes corrigidos por fonte, duplicados mesclados e a lista do que continua sem telefone/nome para preenchimento manual.

## Etapa 6 — Prevenção
- Normalização única de telefone e nome usada por webhook, importação de backup e criação manual.
- Importação de backup passa a procurar o contato existente (por id de mensagem, telefone e nome) antes de criar um novo.
- Unicidade no banco: id externo de mensagem e telefone por empresa.
- Bloqueio de gravação de nome puramente numérico quando existir fonte melhor, e enriquecimento automático quando o `pushName` chegar pelo webhook.
- Verificação periódica reportando contatos sem telefone, nomes numéricos e duplicados.

## Detalhes técnicos
- Nova tabela de referência `contact_directory` (empresa opcional, telefone normalizado, nomes, origem) com grants e RLS por empresa; carga a partir das planilhas.
- Função `recover-contact-phones` ampliada com os 4 passes, `dryRun`, lote configurável e log de evidência por contato.
- Nova rotina de correção de nomes e de merge de contatos duplicados, idempotentes.
- Banco (aditivo): índices/restrições de unicidade; nenhum `DROP` de dados.
- Frontend: em Contatos, filtros "sem telefone" e "nome inválido", botões de simulação/aplicação e download do relatório.
- Produção: nenhum envio de mensagem; todas as ações de dados começam em simulação e são aplicadas só após sua confirmação.

## Ordem de execução
Etapa 1 → 2 (passe por passe, com sua validação) → 3 → 4 → 5 → 6.
