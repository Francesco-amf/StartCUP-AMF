# ⚡ Quick Fix: Problema de Timezone no Deadline

## Se o Problema For Timezone (MAIS PROVÁVEL)

Se você está em **São Paulo (GMT-3)** e o banco está em **UTC**, a diferença é de **3 horas = 180 minutos**.

Isso explicaria:
- Mostra 173 minutos quando deveria mostrar 30 minutos
- 173 = 30 + 143 (aproximadamente 3 horas de diferença)

---

## Diagnóstico Rápido (30 segundos)

Abra DevTools (F12) → Console e execute:

```javascript
// Seu horário local
console.log('Seu horário:', new Date().toISOString())

// Se o banco estiver em UTC e você em São Paulo:
// A diferença será ~3 horas
```

---

## Solução 1: Corrigir no Frontend (Rápido ✅)

Edite `src/components/quest/SubmissionDeadlineStatus.tsx` linha 51:

### ANTES:
```typescript
const startedAt = new Date(quest.started_at)
```

### DEPOIS:
```typescript
const startedAt = new Date(quest.started_at)
// Se banco está em UTC, ajustar para timezone local (São Paulo = -3 horas)
const timezoneOffset = -3 * 60 * 60 * 1000  // -3 horas em milliseconds
const adjustedStartedAt = new Date(startedAt.getTime() + timezoneOffset)
```

Mas isso é **HACK**. Melhor é...

---

## Solução 2: Corrigir no Backend/Banco (Correto ✅✅)

No Supabase SQL Editor, execute:

```sql
-- Ver qual é o horário do servidor agora
SELECT NOW();

-- Se for UTC quando deveria ser São Paulo, o banco tem problema
-- Mas a MELHOR solução é ao buscar a quest, converter para o timezone certo
```

Edite `src/components/quest/SubmissionDeadlineStatus.tsx` linha 34-38:

### ANTES:
```typescript
const { data: quest, error: questError } = await supabase
  .from('quests')
  .select('id, name, started_at, planned_deadline_minutes, late_submission_window_minutes')
  .eq('id', questId)
  .single()
```

### DEPOIS:
```typescript
// Buscar e converter timezone no banco (mais eficiente)
const { data: quest, error: questError } = await supabase
  .from('quests')
  .select(`
    id,
    name,
    started_at,
    planned_deadline_minutes,
    late_submission_window_minutes
  `)
  .eq('id', questId)
  .single()

// Se banco está em UTC mas você quer São Paulo:
if (quest && quest.started_at) {
  const startedAtUTC = new Date(quest.started_at)
  const tzOffset = -3 * 60 * 60 * 1000  // São Paulo
  quest.started_at = new Date(startedAtUTC.getTime() + tzOffset).toISOString()
}
```

---

## Solução 3: Corrigir Ao Ativar Quest (Mais Robusta ✅✅✅)

Quando admin clica "Ativar Fase", certifique que `started_at` está sendo setado em **horário local**, não UTC.

No endpoint `/api/admin/start-phase-with-quests`, verifique:

```typescript
// ANTES (pode estar salvando em UTC):
const { data } = await supabase
  .from('quests')
  .update({ status: 'active', started_at: new Date().toISOString() })

// DEPOIS (salvar em horário local):
const now = new Date()
const tzOffset = -3 * 60 * 60 * 1000  // São Paulo
const localTime = new Date(now.getTime() + tzOffset).toISOString()

const { data } = await supabase
  .from('quests')
  .update({ status: 'active', started_at: localTime })
```

---

## Para Saber Qual Solução Aplicar

Execute no Supabase SQL Editor:

```sql
-- Query 1: Ver horário do servidor
SELECT NOW() as server_time;

-- Query 2: Ver started_at de uma quest ativa
SELECT started_at FROM quests WHERE status = 'active' LIMIT 1;

-- Query 3: Calcular a diferença
SELECT
  NOW() as server_now,
  (SELECT started_at FROM quests WHERE status = 'active' LIMIT 1) as quest_started_at,
  EXTRACT(EPOCH FROM (NOW() - (SELECT started_at FROM quests WHERE status = 'active' LIMIT 1))) / 3600 as difference_hours;
```

**Se o resultado for ~3 horas de diferença**: É timezone!
**Se for outro valor**: É outro problema.

---

## Resumo das 3 Soluções

| Solução | Quando Usar | Velocidade | Qualidade |
|---------|-----------|-----------|----------|
| **1. Frontend** | Teste rápido | ⚡⚡⚡ | ⭐ |
| **2. Backend** | Solução temporária | ⚡⚡ | ⭐⭐ |
| **3. No Ativar** | Solução permanente | ⚡ | ⭐⭐⭐ |

---

## Próximos Passos

1. Execute as queries SQL acima
2. Verifique se há diferença de ~3 horas
3. Se sim, aplique a Solução 2 ou 3
4. Teste novamente

---

**Arquivo**: `DEBUG_DEADLINE.sql` - para diagnosticar
**Status**: Pronto para aplicar fix
