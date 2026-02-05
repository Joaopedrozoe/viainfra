

# Suporte a Quebra de Linha no Campo de Mensagem

## Problema

O campo de envio de mensagens usa um componente `<Input>` (input HTML de linha única), que por natureza não suporta quebras de linha. Mesmo que o handler de teclado já permita Shift+Enter (não envia), o campo não consegue exibir múltiplas linhas.

---

## Solucao

Substituir o `<Input>` por um `<Textarea>` com altura dinamica que cresce conforme o usuario digita, mantendo a experiencia visual compacta.

---

## Detalhes Tecnicos

### Arquivo: `src/components/app/chat/ChatInput.tsx`

**Alteracao 1: Importar Textarea**

```typescript
// Linha 2 - Remover Input, adicionar Textarea
import { Textarea } from "@/components/ui/textarea";
```

**Alteracao 2: Substituir Input por Textarea**

Linhas 216-225 - Substituir:

```typescript
<div className="flex-1">
  <Input
    placeholder={inputPlaceholder}
    value={newMessage}
    onChange={(e) => setNewMessage(e.target.value)}
    onKeyDown={handleKeyDown}
    className="w-full"
    disabled={isRecording}
    aria-label="Digite uma mensagem"
  />
</div>
```

Por:

```typescript
<div className="flex-1">
  <Textarea
    placeholder={inputPlaceholder}
    value={newMessage}
    onChange={(e) => setNewMessage(e.target.value)}
    onKeyDown={handleKeyDown}
    className="w-full min-h-10 max-h-32 resize-none py-2"
    disabled={isRecording}
    aria-label="Digite uma mensagem"
    rows={1}
  />
</div>
```

**Alteracao 3: Ajustar layout para alinhamento**

Linha 194 - Atualizar flex container:

```typescript
<div className="flex space-x-2 items-end">
```

Isso garante que os botoes fiquem alinhados na base quando o Textarea crescer.

---

## Comportamento Esperado

| Tecla | Acao |
|-------|------|
| Enter | Envia a mensagem |
| Shift + Enter | Insere quebra de linha (nova linha) |

O campo:
- Inicia com altura minima (1 linha, ~40px)
- Cresce automaticamente ate 4-5 linhas (~128px)
- Nao permite redimensionamento manual (resize-none)
- Mantem scroll interno se exceder altura maxima

---

## Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/app/chat/ChatInput.tsx` | Substituir Input por Textarea com altura dinamica |

