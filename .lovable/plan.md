

# Revisao: Exclusao de Mensagens via WhatsApp

## Resumo do Problema

Ao usar a opcao "Apagar" no menu de contexto de uma mensagem, atualmente:
- A mensagem e removida **apenas do banco de dados local (CRM)**
- A mensagem **permanece visivel** no WhatsApp oficial do destinatario
- A UI ja informa isso via tooltip: "Remove apenas do CRM - não afeta o WhatsApp"

O usuario espera que a exclusao seja propagada para o WhatsApp ("apagar para todos").

---

## Analise da Implementacao Atual

### Frontend - DeleteMessageDialog.tsx
```typescript
// Confirma exclusao chamando onConfirm com o messageId
const handleConfirm = () => {
  if (!message) return;
  onConfirm(message.id);
  onOpenChange(false);
};
```

### Frontend - ChatWindow.tsx (linha 731-747)
```typescript
// Apenas deleta do banco local - NAO propaga para WhatsApp
const handleConfirmDelete = useCallback(async (messageId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    
    if (error) throw error;
    
    deleteMessage(messageId);  // Remove da UI
    toast.success('Mensagem apagada!');
  } catch (error) {
    toast.error('Erro ao apagar mensagem');
  }
}, [deleteMessage]);
```

### UI - MessageActions.tsx (linha 158-163)
```typescript
// O tooltip ja avisa que nao afeta WhatsApp
<MenuItemWithTooltip
  icon={Trash2}
  label="Apagar"
  tooltip="Remove apenas do CRM - não afeta o WhatsApp"
  onClick={() => onDelete(message)}
/>
```

---

## Capacidade da Evolution API

A Evolution API **suporta exclusao de mensagens para todos** via:

```text
DELETE /chat/deleteMessageForEveryone/{instanceName}
```

**Payload necessario**:
```json
{
  "id": "BAE5ABC123...",     // WhatsApp Message ID
  "remoteJid": "5511999999999@s.whatsapp.net",
  "fromMe": true             // true se enviada pelo agente
}
```

**Limitacoes do WhatsApp**:
- Exclusao para todos funciona apenas em mensagens recentes (prazo de ~1 hora)
- Apos o prazo, apenas exclusao local e possivel
- Mensagens recebidas (fromMe: false) nao podem ser apagadas "para todos"

---

## Secao Tecnica: Plano de Implementacao

### 1. Adicionar Handler na Edge Function

**Arquivo**: `supabase/functions/send-whatsapp-message/index.ts`

Adicionar suporte para `action: 'deleteMessage'` (similar ao `updateMessage` existente):

```typescript
// No inicio do handler principal (apos linha 40)
if (body.action === 'deleteMessage') {
  return await handleDeleteMessage(body);
}

// Nova funcao ao final do arquivo
async function handleDeleteMessage(body: {
  instanceName: string;
  remoteJid: string;
  messageId: string;
  fromMe: boolean;
}): Promise<Response> {
  const { instanceName, remoteJid, messageId, fromMe } = body;
  
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
  
  // Chamar endpoint DELETE
  const deleteUrl = `${evolutionApiUrl}/chat/deleteMessageForEveryone/${instanceName}`;
  
  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'apikey': evolutionApiKey
    },
    body: JSON.stringify({
      id: messageId,
      remoteJid: remoteJid,
      fromMe: fromMe
    })
  });
  
  // Retornar resultado
  if (!response.ok) {
    return new Response(
      JSON.stringify({ success: false, error: 'WhatsApp deletion failed' }),
      { status: response.status, headers: corsHeaders }
    );
  }
  
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: corsHeaders }
  );
}
```

### 2. Atualizar handleConfirmDelete no Frontend

**Arquivo**: `src/components/app/ChatWindow.tsx` (linhas 730-747)

Modificar para tentar exclusao no WhatsApp antes de deletar localmente:

```typescript
const handleConfirmDelete = useCallback(async (messageId: string) => {
  try {
    // Buscar dados da mensagem para exclusao WhatsApp
    const { data: msgData } = await supabase
      .from('messages')
      .select('metadata')
      .eq('id', messageId)
      .single();
    
    const metadata = msgData?.metadata as Record<string, any>;
    const whatsappMessageId = metadata?.whatsappMessageId || metadata?.external_id;
    const remoteJid = metadata?.remoteJid;
    const isFromAgent = metadata?.sender_type === 'agent' || 
                        deletingMessage?.sender === 'agent';
    
    // Se for WhatsApp e tiver messageId, tentar excluir no WhatsApp
    if (conversationChannel === 'whatsapp' && whatsappMessageId && remoteJid) {
      // Buscar instancia
      const { data: conversation } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();
      
      const instanceName = (conversation?.metadata as any)?.instanceName || 'VIAINFRAOFICIAL';
      
      try {
        const { data: deleteResult, error: deleteError } = await supabase.functions.invoke(
          'send-whatsapp-message',
          {
            body: {
              action: 'deleteMessage',
              instanceName,
              remoteJid,
              messageId: whatsappMessageId,
              fromMe: isFromAgent
            }
          }
        );
        
        if (deleteError || !deleteResult?.success) {
          // WhatsApp falhou - avisar usuario mas ainda deletar local
          toast.warning('Mensagem apagada localmente. Exclusão no WhatsApp não disponível.', {
            description: 'O WhatsApp limita exclusão após ~1 hora ou para mensagens recebidas'
          });
        } else {
          toast.success('Mensagem apagada do WhatsApp!');
        }
      } catch (whatsappError) {
        console.warn('Erro ao excluir no WhatsApp:', whatsappError);
        toast.warning('Mensagem apagada localmente.');
      }
    }
    
    // Sempre deletar do banco local
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    
    if (error) throw error;
    
    deleteMessage(messageId);
    
    // Se nao for WhatsApp, mostrar sucesso simples
    if (conversationChannel !== 'whatsapp') {
      toast.success('Mensagem apagada!');
    }
  } catch (error) {
    console.error('Erro ao apagar mensagem:', error);
    toast.error('Erro ao apagar mensagem');
  }
}, [deleteMessage, conversationChannel, conversationId, deletingMessage]);
```

### 3. Atualizar Tooltip na UI

**Arquivo**: `src/components/app/chat/MessageActions.tsx` (linhas 157-164)

Atualizar tooltip para refletir o novo comportamento:

```typescript
<MenuItemWithTooltip
  icon={Trash2}
  label="Apagar"
  tooltip={isAgentMessage 
    ? "Tenta apagar para todos no WhatsApp (limite: ~1h após envio)" 
    : "Mensagens recebidas só podem ser removidas do CRM"}
  onClick={() => onDelete(message)}
  className="text-destructive focus:text-destructive"
/>
```

---

## Comportamento Esperado Apos Implementacao

| Cenario | Comportamento |
|---------|---------------|
| Mensagem enviada pelo agente (< 1h) | Apaga no WhatsApp + CRM |
| Mensagem enviada pelo agente (> 1h) | Toast warning + Apaga so no CRM |
| Mensagem recebida do contato | Toast info + Apaga so no CRM |
| Conversa Web (nao-WhatsApp) | Apaga no CRM (comportamento atual) |

---

## Arquivos a Serem Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/send-whatsapp-message/index.ts` | Adicionar `handleDeleteMessage` |
| `src/components/app/ChatWindow.tsx` | Modificar `handleConfirmDelete` |
| `src/components/app/chat/MessageActions.tsx` | Atualizar tooltip |

---

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| API WhatsApp falhar | Sempre deleta local + toast de aviso |
| Mensagem sem whatsappMessageId | Deleta apenas local (comportamento atual) |
| Prazo de exclusao expirado | Toast warning informativo |
| Tentativa de apagar mensagem recebida | Tooltip informa limitacao |

---

## Alinhamento com Restricoes

- **Sem testes adicionais ativos**: Alteracoes sao transparentes e seguem padrao existente
- **Sem impacto no ambiente**: Fallback para comportamento atual em caso de erro
- **Experiencia visual clara**: Feedbacks via toast informam exatamente o que aconteceu

