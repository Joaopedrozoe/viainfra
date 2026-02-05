

# Revisao: Edicao de Mensagens no WhatsApp

## Problema Identificado

As mensagens editadas no app sao atualizadas apenas visualmente no Inbox, mas nao refletem como mensagem editada para o destinatario no WhatsApp.

---

## Diagnostico Detalhado

### Fluxo Atual de Edicao

```text
1. Usuario clica "Editar" em mensagem do agente
2. Dialog abre, usuario altera texto
3. handleSaveEdit() executa:
   - Atualiza banco local (messages.content + metadata.editedAt)
   - Verifica se pode editar no WhatsApp:
     a) conversationChannel === 'whatsapp'? 
     b) whatsappMessageId ou messageId existe?
     c) remoteJid existe?
     d) instanceName existe no metadata da conversa?
4. Se todas condicoes OK, chama Edge Function com action: 'updateMessage'
5. Edge Function chama Evolution API POST /chat/updateMessage/{instanceName}
```

### Problemas Encontrados

Analisando os metadados reais do banco de dados:

| Conversa | instanceName | remoteJid | Resultado |
|----------|--------------|-----------|-----------|
| Conversa 1 | VIAINFRAOFICIAL | 5511914623339@s.whatsapp.net | Pode editar |
| Conversa 2 (grupo) | **AUSENTE** | 120363425512093294@g.us | Nao tenta editar |
| Conversa 3 (grupo) | **AUSENTE** | 120363422252502475@g.us | Nao tenta editar |

**Problema 1: `instanceName` ausente em muitas conversas**

O campo `instanceName` nao esta presente em todas as conversas WhatsApp. Quando ausente, o codigo (linha 599-601) simplesmente mostra "Mensagem editada!" sem tentar a edicao no WhatsApp.

**Problema 2: Fallback insuficiente**

O codigo usa fallback `VIAINFRAOFICIAL` apenas na funcao de exclusao (linha 754), mas nao na funcao de edicao.

**Problema 3: Verificacao silenciosa**

Quando `instanceName` esta ausente, o toast exibe "Mensagem editada!" sem indicar que a edicao no WhatsApp nao foi tentada - o usuario pensa que funcionou.

---

## Secao Tecnica

### Correcao 1: Adicionar Fallback para instanceName na Edicao

**Arquivo**: `src/components/app/ChatWindow.tsx` (linhas 599-621)

Antes:
```typescript
const instanceName = (conversation?.metadata as Record<string, unknown>)?.instanceName;

if (instanceName) {
  // tenta editar
} else {
  toast.success('Mensagem editada!');  // Silencioso - nao indica que WhatsApp nao foi tentado
}
```

Depois:
```typescript
const instanceName = (conversation?.metadata as Record<string, unknown>)?.instanceName || 'VIAINFRAOFICIAL';

// Sempre tenta editar se tiver whatsappMessageId e remoteJid
const { data: editResult, error: editError } = await supabase.functions.invoke('send-whatsapp-message', {
  body: {
    action: 'updateMessage',
    instanceName,
    remoteJid,
    messageId: whatsappMessageId,
    newContent
  }
});

if (editError || !editResult?.success) {
  console.warn('Nao foi possivel editar no WhatsApp:', editError || editResult?.error);
  toast.warning('Mensagem editada localmente. Edicao no WhatsApp nao disponivel.', {
    description: 'O WhatsApp limita edicao a ~15 minutos apos o envio'
  });
} else {
  toast.success('Mensagem editada no WhatsApp!');
}
```

### Correcao 2: Buscar whatsappMessageId com fallback mais robusto

**Arquivo**: `src/components/app/ChatWindow.tsx` (linha 587)

Antes:
```typescript
const whatsappMessageId = currentMetadata.whatsappMessageId || currentMetadata.messageId;
```

Depois:
```typescript
const whatsappMessageId = currentMetadata.whatsappMessageId || 
                          currentMetadata.messageId || 
                          currentMetadata.external_id;
```

### Correcao 3: Atualizar Texto do Dialog de Edicao

**Arquivo**: `src/components/app/chat/EditMessageDialog.tsx` (linha 49)

Antes:
```typescript
<DialogDescription>
  Edite o conteudo da mensagem. A alteracao sera salva localmente.
</DialogDescription>
```

Depois:
```typescript
<DialogDescription>
  Edite o conteudo da mensagem. Em conversas WhatsApp, a edicao sera propagada se a mensagem foi enviada ha menos de 15 minutos.
</DialogDescription>
```

---

## Verificacao do Endpoint da Evolution API

O endpoint atual esta correto segundo a documentacao da Evolution API v2:

```text
POST /chat/updateMessage/{instanceName}
```

Payload:
```json
{
  "number": "5511999999999@s.whatsapp.net",
  "text": "Novo conteudo da mensagem",
  "key": {
    "remoteJid": "5511999999999@s.whatsapp.net",
    "fromMe": true,
    "id": "BAE5ABC123..."
  }
}
```

A implementacao na Edge Function (linhas 714-747) esta correta. O problema esta no frontend que nao tenta a edicao quando `instanceName` esta ausente.

---

## Comportamento Esperado Apos Correcoes

| Cenario | Resultado |
|---------|-----------|
| Mensagem enviada < 15 min + todos dados | Edita no WhatsApp + toast sucesso |
| Mensagem enviada > 15 min | Toast warning "limitacao de tempo" |
| Conversa sem instanceName | Usa fallback VIAINFRAOFICIAL + tenta editar |
| Mensagem sem whatsappMessageId | Toast warning "edicao local apenas" |
| Canal nao-WhatsApp | Edita local + toast sucesso |

---

## Arquivos a Serem Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/app/ChatWindow.tsx` | Adicionar fallback instanceName + fallback messageId |
| `src/components/app/chat/EditMessageDialog.tsx` | Atualizar texto descritivo |

---

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Instancia incorreta | Fallback usa VIAINFRAOFICIAL (unica instancia autorizada) |
| API retorna erro | Toast warning informa usuario, salva local |
| Limite de tempo expirado | Toast warning claro sobre limitacao |

