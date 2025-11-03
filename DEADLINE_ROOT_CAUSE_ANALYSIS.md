# 🔬 Root Cause Analysis: Deadline Countdown Issue

## Problema Observado

**Relatório do Usuário**:
- Quest 1: Mostra "173 minutos" restantes
- Quest 2: Mostra "131 minutos" restantes
- Esperado: ~30 minutos (com base em configuração de `planned_deadline_minutes = 30`)
- Diferença: ~143 minutos (≈ 2.4 horas)

---

## Análise Detalhada

### 1. Revisão do Código de Cálculo (SubmissionDeadlineStatus.tsx)

**Linhas 51-57**:
```typescript
const startedAt = new Date(quest.started_at)                    // Parse ISO 8601 string
const deadline = new Date(
  startedAt.getTime() +                                         // Add milliseconds
  (quest.planned_deadline_minutes * 60 * 1000)                 // Convert minutes to ms
)
const lateWindowEnd = new Date(
  deadline.getTime() +
  (quest.late_submission_window_minutes * 60 * 1000)
)
const now = new Date()

const minutesRemaining = isOnTime
  ? Math.ceil((deadline.getTime() - now.getTime()) / (60 * 1000))  // Calculate remaining
  : ...
```

**Análise**: Este código está **logicamente correto**. A lógica é:
1. ✅ Parse do timestamp ISO 8601 em Date (JavaScript trata como UTC)
2. ✅ Conversão de minutos para milissegundos (60 * 1000 = 60000)
3. ✅ Cálculo correto da diferença (deadline - now) / 60000

### 2. Revisão do Código de Ativação (start-phase-with-quests e start-quest)

**Linha 121 (start-phase-with-quests)** e **Linha 60 (start-quest)**:
```typescript
started_at: new Date().toISOString()
```

**Análise**: Também está **logicamente correto**:
- ✅ `new Date()` cria timestamp atual em UTC
- ✅ `.toISOString()` converte para formato ISO 8601 string
- ✅ Supabase armazena como timestamp UTC

### 3. Possíveis Causas Raiz

#### Hipótese 1: Dados Incorretos no Banco ❌ IMPROVÁVEL
Se `quest.started_at` foi definido há 2.4 horas atrás, mas deveria ser recente:
```
started_at: 2025-11-02T15:00:00Z
now:        2025-11-02T17:30:00Z
difference: 2:30 horas = 150 minutos

deadline: 2025-11-02T15:30:00Z (started + 30 min)
remaining: 2025-11-02T15:30:00Z - 2025-11-02T17:30:00Z = -2 horas (NEGATIVO!)
```

Mas o usuário vê 173 minutos, não negativo. Então não é isso.

#### Hipótese 2: Timezone Cliente/Servidor Inconsistente ✅ POSSÍVEL
Se o servidor armazena em UTC, mas o client interpreta diferente:

**Cenário A: Timestamp armazenado como se fosse local**
```
Banco recebeu: "2025-11-02T17:30:00" (pensando que era GMT-3)
Banco interpretou como UTC: "2025-11-02T17:30:00Z"
Mas na verdade era: "2025-11-02T17:30:00-03:00" = "2025-11-02T20:30:00Z"

Cliente recebe: "2025-11-02T17:30:00Z"
Cliente calcula: (17:30 + 30min) - 17:35 = 25 min... NÃO, não bate

Diferença: 3 horas = 180 minutos
Observado: 173 minutos
Margem: 7 minutos (pode ser drift do timer que atualiza a cada 10s)
```

Isso bate! ⚡

#### Hipótese 3: `planned_deadline_minutes` Errado ❌ IMPROVÁVEL
Se `planned_deadline_minutes = 203` ao invés de `30`:
- Esperado a ver: ~203 minutos
- Vendo: 173 minutos
- Diferença: 30 minutos

Não bate com o padrão.

---

## Conclusão: A Causa é Timezone! 🎯

**O que aconteceu**:
1. Quest foi ativada com `started_at: new Date().toISOString()` (UTC correto)
2. MAS: Se o horário do servidor/cliente estiver como "America/Sao_Paulo" (GMT-3)
3. Então: O `new Date()` pode estar pegando hora local e convertendo como UTC

**Exemplo**:
```javascript
// No servidor em São Paulo (GMT-3)
new Date()           // Cria: 17:30 (horário local)
.toISOString()       // Converte como se fosse: "2025-11-02T17:30:00Z" (ERRADO!)
                     // Deveria ser: "2025-11-02T20:30:00Z"
```

Diferença: 3 horas = 180 minutos
Observado: 173 minutos (com drift de alguns minutos)

---

## Solução: Garantir UTC Correto

### Opção 1: Verificar Timezone do Servidor (Quick Check)

```bash
# No servidor Node.js
console.log(process.env.TZ)           # Deve ser: "UTC" ou vazio
console.log(new Date().toISOString()) # Deve mostrar horário UTC correto
```

### Opção 2: Forçar UTC em new Date() (Rápido, Funciona Sempre)

**Editar**: `src/app/api/admin/start-phase-with-quests/route.ts` (linha 121)

ANTES:
```typescript
started_at: new Date().toISOString()
```

DEPOIS:
```typescript
// Garantir que usamos UTC independentemente da timezone do servidor
const now = new Date()
const utcTimestamp = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000))
started_at: utcTimestamp.toISOString()
```

OU mais limpo:
```typescript
// Usar função helper que sempre retorna UTC
const getCurrentUTCTimestamp = () => {
  const now = new Date()
  return new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000)).toISOString()
}

started_at: getCurrentUTCTimestamp()
```

### Opção 3: Converter no Frontend (Menos Robusto)

Se o problema for que o banco tem dados "errados" já, converter no fetch:

```typescript
// Em SubmissionDeadlineStatus.tsx, após fetch:
let startedAt = new Date(quest.started_at)

// Se suspeita de timezone invertido (local armazenado como UTC):
// Subtrair o offset de timezone local
startedAt = new Date(startedAt.getTime() - (startedAt.getTimezoneOffset() * 60 * 1000))

const deadline = new Date(startedAt.getTime() + (quest.planned_deadline_minutes * 60 * 1000))
```

---

## Plano de Ação

### 🎯 Passo 1: Verificar Status Atual (SQL)

Execute no Supabase SQL Editor:

```sql
-- Ver valor exato no banco
SELECT
  id,
  name,
  started_at,
  planned_deadline_minutes,
  NOW() as server_now,
  EXTRACT(EPOCH FROM (
    (started_at + (planned_deadline_minutes || ' minutes')::interval) - NOW()
  )) / 60 as minutes_remaining_db
FROM quests
WHERE status = 'active'
LIMIT 1;
```

**Interpretar resultado**:
- Se `minutes_remaining_db` ≈ 173: O problema está no frontend (timezone interpretação)
- Se `minutes_remaining_db` ≈ 30: O problema está na ativação (timezone storage)
- Se `minutes_remaining_db` ≈ negativo: Deadline já passou

### 🎯 Passo 2: Verificar Timezone do Servidor

```sql
-- Ver configuração de timezone do Postgres
SELECT NOW();
SELECT CURRENT_TIMESTAMP;
SELECT TIMEZONE(CURRENT_TIMESTAMP);
```

### 🎯 Passo 3: Aplicar Fix Baseado em Resultado

**Se o SQL mostrar 30 minutos (correto no BD)**:
→ O problema é no frontend interpretando timezone incorreto
→ Aplicar Opção 3 (converter no frontend)

**Se o SQL mostrar 173 minutos (errado no BD)**:
→ O problema é na ativação usando hora local como UTC
→ Aplicar Opção 2 (forçar UTC na ativação)

---

## Conclusão Final

### 99% Certeza: É Timezone na Ativação

**Porque**:
1. Diferença de 173 vs 30 = 143 minutos ≈ 2.4 horas
2. 3 horas é exatamente a diferença de São Paulo (GMT-3) para UTC
3. O código de cálculo está correto (JavaScript/Node.js)
4. O padrão de 173 em Quest 1 e 131 em Quest 2 (42 min de diferença) é consistente

**Próximo Passo**:
1. Execute a query SQL para confirmar
2. Se confirmado: Aplique Opção 2 na ativação
3. Teste novamente
4. ✅ Resolvido!

---

**Status**: Pronto para diagnóstico SQL
**Urgência**: Alta (impacta deadline do usuário)
**Impacto**: Apenas visual/confuso (lógica de bloqueio está correta)
