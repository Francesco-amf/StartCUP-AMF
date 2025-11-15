# 🐛 Debug Mode Configuration

## Overview

O sistema agora usa um **centralized debug system** que controla todos os console logs de toda a aplicação através de uma única variável de ambiente.

## Problem Solved

**Antes**: Console cheio de logs de debug que dificultava identificar problemas reais
```
📡 [useRealtimeQuests] Iniciando Realtime...
⏳ [useRealtimeQuests-Polling] Buscando quests...
📊 [EventEndCountdownWrapper] Estado atual: {...}
[useRealtimePhase] Usando cache RPC...
...e muitos mais logs
```

**Depois**: Console limpo em produção, logs disponíveis quando necessário para debug

## Como Usar

### 1. Habilitar Debug (Desenvolvimento)

Edite `.env.local`:
```bash
NEXT_PUBLIC_DEBUG=true
```

Reinicie o servidor:
```bash
npm run dev
```

Agora o console mostrará todos os logs de debug:
```
[useRealtimeQuests] 📡 Iniciando Realtime para phase_id: 1
[useRealtimePhase] ✅ RPC success
[useRealtimePenalties] 🔊 PENALTY NOVA: Equipe A
```

### 2. Desabilitar Debug (Produção - PADRÃO)

Edite `.env.local`:
```bash
NEXT_PUBLIC_DEBUG=false
```

Ou apenas remova a linha (padrão é `false` se não definido).

Reinicie o servidor - console estará limpo:
```
(nenhum log de debug)
```

## Arquivos Modificados

- ✅ [`src/lib/debug.ts`](src/lib/debug.ts) - Sistema centralizado de debug
- ✅ [`src/lib/hooks/useRealtimeQuests.ts`](src/lib/hooks/useRealtimeQuests.ts) - Migrado para DEBUG
- ✅ [`src/lib/hooks/useRealtime.ts`](src/lib/hooks/useRealtime.ts) - Migrado para DEBUG
- ✅ [`src/components/EventEndCountdownWrapper.tsx`](src/components/EventEndCountdownWrapper.tsx) - Migrado para DEBUG
- ✅ [`.env.local`](.env.local) - Adicionado `NEXT_PUBLIC_DEBUG=false`

## Como o Debug System Funciona

### DEBUG Module (`src/lib/debug.ts`)

```typescript
import { DEBUG } from '@/lib/debug'

// Log informativo (só mostrado se NEXT_PUBLIC_DEBUG=true)
DEBUG.log('moduleName', 'Mensagem aqui')

// Log de aviso (só mostrado se NEXT_PUBLIC_DEBUG=true)
DEBUG.warn('moduleName', 'Aviso aqui')

// Log de erro (SEMPRE mostrado, mesmo em produção)
DEBUG.error('moduleName', 'Erro crítico:', error)
```

### Níveis de Log

| Método | Produção | Desenvolvimento | Uso |
|--------|----------|-----------------|-----|
| `DEBUG.log()` | ❌ Oculto | ✅ Visível | Informações gerais |
| `DEBUG.warn()` | ❌ Oculto | ✅ Visível | Avisos e falhas esperadas |
| `DEBUG.error()` | ✅ Sempre visível | ✅ Visível | Erros críticos (nunca ocultar) |

## Benefícios

✅ **Console Limpo em Produção**: Sem ruído de debug desnecessário
✅ **Debugging Fácil**: Ative com uma variável de ambiente
✅ **Sem Hardcoding**: Sem `if (process.env.NODE_ENV === 'development')`
✅ **Consistent**: Mesmo padrão em toda a aplicação
✅ **Performance**: Logs desativados = zero overhead
✅ **Segurança**: Sem exposição de lógica interna em produção

## Exemplo Real

### useRealtimeQuests.ts - Antes
```typescript
console.log(`📡 [useRealtimeQuests] Iniciando Realtime para phase_id: ${phaseId}`)
console.log(`⏳ [useRealtimeQuests] Fazendo initial load...`)
```

### useRealtimeQuests.ts - Depois
```typescript
import { DEBUG } from '@/lib/debug'

DEBUG.log('useRealtimeQuests', `📡 Iniciando Realtime para phase_id: ${phaseId}`)
DEBUG.log('useRealtimeQuests', `⏳ Fazendo initial load...`)
```

## Verificação

Para verificar se debug está funcionando:

**Com NEXT_PUBLIC_DEBUG=true:**
```
[useRealtimeQuests] 📡 Iniciando Realtime...
[useRealtimePhase] ✅ Usando cache RPC (válido por mais 4500ms)
[EventEndCountdownWrapper] 👁️ Page visibility: visible
```

**Com NEXT_PUBLIC_DEBUG=false:**
```
(console vazio, sem logs)
```

## Próximos Passos

1. ✅ Implantação em produção com `NEXT_PUBLIC_DEBUG=false`
2. ✅ Se precisar debugar em produção, altere para `true` e reinicie
3. ✅ Logs de erro nunca são ocultos - sempre visíveis quando há problemas

---

**Status**: ✅ Implementado
**Data**: 2025-11-14
**Impacto**: Console limpo, sem mudanças de funcionalidade
