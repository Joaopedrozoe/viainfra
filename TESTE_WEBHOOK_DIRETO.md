# 🧪 TESTE: Provar que o Webhook do Lovable Funciona

## Execute este comando no seu servidor da Evolution API:

```bash
curl -X POST https://xxojpfhnkxpbznbmhmua.supabase.co/functions/v1/evolution-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "VIAINFRA2",
    "data": [{
      "message": {
        "key": {
          "id": "TEST123",
          "remoteJid": "5511999999999@s.whatsapp.net",
          "fromMe": false
        },
        "message": {
          "conversation": "TESTE MANUAL DO WEBHOOK"
        },
        "messageTimestamp": 1761928500,
        "pushName": "Teste"
      }
    }]
  }'
```

## O que deve acontecer:

1. ✅ Log aparece no edge function evolution-webhook
2. ✅ Nova conversa criada na plataforma
3. ✅ Mensagem "TESTE MANUAL DO WEBHOOK" aparece no inbox

## Se funcionar:

**PROVA** que o Lovable está OK e o problema é 100% na Evolution API não enviando webhooks de mensagens reais.

## Configuração que DEVE estar na Evolution API:

Na Evolution Manager (http://SEU_IP:8080):

1. **Instances** → **VIAINFRA2** → **Webhook Settings**
2. Verificar:
   - ✅ **Webhook Enabled**: `true`
   - ✅ **Webhook URL**: `https://xxojpfhnkxpbznbmhmua.supabase.co/functions/v1/evolution-webhook`
   - ✅ **Events**: **MESSAGES_UPSERT** DEVE ESTAR MARCADO ⚠️
   - ✅ **Webhook by Events**: `false`

## Possível causa:

A Evolution API pode ter:
- Evento `MESSAGES_UPSERT` desmarcado
- Filtro que bloqueia mensagens de números específicos
- Bug que impede envio de webhooks de mensagens

Execute o curl acima e me diga o resultado!
