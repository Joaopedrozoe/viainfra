# Como Integrar o Widget de Chat Viainfra

## Passo 1: Obter o Company ID

1. Faça login no painel administrativo
2. Vá em Settings
3. Copie o **Company ID** da sua empresa

## Passo 2: Configurar o Widget

Abra o arquivo `widget-embed.html` e substitua `YOUR_COMPANY_ID_HERE` pelo seu Company ID real:

```javascript
const COMPANY_ID = 'seu-company-id-aqui';
```

## Passo 3: Inserir no Site

Adicione o seguinte código no final do `<body>` do seu site:

```html
<iframe 
  src="https://seu-dominio.com/widget-embed.html" 
  style="border: none; position: fixed; bottom: 0; right: 0; width: 100%; height: 100%; z-index: 9997; pointer-events: none;"
  allow="clipboard-write"
></iframe>

<style>
  #viainfra-chat-button,
  #viainfra-chat-widget {
    pointer-events: all;
  }
</style>
```

## Passo 4: Personalização (Opcional)

Você pode personalizar as cores do widget editando o arquivo `widget-embed.html`:

- Cor do botão: `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);`
- Cor do cabeçalho: mesma linha acima na classe `.chat-header`

## Segurança e LGPD

O widget está configurado para:
- ✅ Armazenar dados apenas no Supabase (criptografado)
- ✅ Não usar cookies de terceiros
- ✅ Comunicação via HTTPS
- ✅ Dados isolados por empresa (Company ID)
- ✅ RLS (Row Level Security) habilitado no banco

### Política de Privacidade

Certifique-se de incluir em sua política de privacidade:
- Coleta de nome, telefone e email (se fornecidos)
- Armazenamento de mensagens do chat
- Finalidade: suporte ao cliente
- Direito de exclusão dos dados (LGPD Art. 18)

## Suporte

Para dúvidas, entre em contato com o suporte técnico.
