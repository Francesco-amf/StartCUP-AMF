# 🔍 Debug: Tempo Restante Incorreto da Quest

## Problema Identificado

Quest 1 mostra **tempo restante incorreto** (pode estar mostrando muito tempo ou pouco tempo comparado ao esperado).

**Exemplo**:
- Esperado: ~30 minutos (se começou há poucos minutos)
- Mostrado: 173 minutos

---

## Possíveis Causas

### 1. **Timezone/Fuso Horário Errado** ⚠️ MAIS PROVÁVEL
Se o servidor está em UTC mas a aplicação espera horário local (Brasil), terá diferença de 3-5 horas.

**Como verificar**:
```sql
-- No Supabase SQL Editor, execute:
SELECT NOW() as horario_agora;
```

Se for ~3-5 horas ANTES do seu horário local, esse é o problema!

### 2. **started_at não foi definido quando quest foi ativada**
A quest pode ter sido criada mas `started_at` não foi preenchido quando foi ativada.

### 3. **planned_deadline_minutes está com valor errado**
Pode estar configurado com valor muito alto no banco.

---

## Como Diagnosticar

### Passo 1: Verificar dados no banco
Execute no Supabase SQL Editor:

```sql
SELECT
  id,
  name,
  started_at,
  planned_deadline_minutes,
  EXTRACT(EPOCH FROM ((started_at + (planned_deadline_minutes || ' minutes')::interval) - NOW())) / 60 as minutes_remaining_now
FROM quests
WHERE status = 'active'
LIMIT 1;
```

**O que procurar**:
- `started_at`: Deve ser recente (ultimos minutos)
- `planned_deadline_minutes`: Deve ser ~30 (ou seu valor configurado)
- `minutes_remaining_now`: Deve ser próximo a 30 minutos

### Passo 2: Verificar se é timezone
```sql
SELECT
  NOW() as horario_utc,
  started_at AT TIME ZONE 'America/Sao_Paulo' as horario_br
FROM quests
WHERE status = 'active'
LIMIT 1;
```

Compare o horário UTC com seu relógio local. Se diferir ~3-5 horas, é timezone!

### Passo 3: Verificar localStorage/sessão
Abra DevTools (F12) → Application → Local Storage:
- Procure por qualquer timestamp armazenado
- Compare com `new Date().toISOString()` no console

---

## Soluções

### Se for Timezone
O Supabase pode estar usando UTC, mas sua aplicação espera horário local.

**Opção 1**: Converter no banco (melhor)
```sql
-- Ao buscar deadlines, converter para timezone local
SELECT
  id,
  name,
  started_at AT TIME ZONE 'America/Sao_Paulo' as started_at_local,
  planned_deadline_minutes
FROM quests
WHERE status = 'active';
```

**Opção 2**: Converter no frontend
```typescript
const startedAt = new Date(quest.started_at)
// Se banco está em UTC, ajustar para local
const localStartedAt = new Date(startedAt.getTime() + offsetTimezone)
```

### Se for started_at nulo
```sql
-- Verificar quests sem started_at
SELECT * FROM quests WHERE started_at IS NULL;

-- Se houver, atualizar para NOW():
UPDATE quests
SET started_at = NOW()
WHERE started_at IS NULL AND status = 'active';
```

### Se for planned_deadline_minutes errado
```sql
-- Verificar valores
SELECT id, name, planned_deadline_minutes FROM quests WHERE status = 'active';

-- Corrigir se necessário
UPDATE quests
SET planned_deadline_minutes = 30
WHERE status = 'active' AND planned_deadline_minutes > 200;
```

---

## Script de Debug Completo

Use `DEBUG_DEADLINE.sql` (arquivo criado junto):
1. Abra Supabase → SQL Editor
2. Cole o conteúdo de `DEBUG_DEADLINE.sql`
3. Execute cada query
4. Analise os resultados

---

## O Que Você Precisa Fazer

1. **Execute o debug SQL** (veja arquivo `DEBUG_DEADLINE.sql`)
2. **Compartilhe o resultado** das queries
3. Com base nos dados, aplicaremos a solução correta

---

## Checklist de Verificação

- [ ] Executei as queries de debug
- [ ] Verifiquei `started_at` (está recente?)
- [ ] Verifiquei `planned_deadline_minutes` (valor correto?)
- [ ] Verifiquei timezone (diferença de horas?)
- [ ] Compartilhei os resultados

---

## Código Atual vs Esperado

### Código Atual (linha 51-52 de SubmissionDeadlineStatus.tsx):
```typescript
const startedAt = new Date(quest.started_at)  // String → Date
const deadline = new Date(startedAt.getTime() + (quest.planned_deadline_minutes * 60 * 1000))
```

Isso está **logicamente correto**. O problema é com os dados, não com a lógica.

---

**Arquivo de Debug**: `DEBUG_DEADLINE.sql`
**Próximo Passo**: Execute o SQL e compartilhe os resultados!
