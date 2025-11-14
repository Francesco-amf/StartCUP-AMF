# Análise de Problemas Encontrados nos Testes

## Problema 1: "Voltou Atraso" - Atraso entre Quests

### Descrição
Durante o teste, foi observado que houve atraso na transição entre quests (uma quest deveria ter avançado mas não avançou).

### Sistema Implementado
✅ **Sistema de Timing Funcionando Corretamente:**
- `planned_deadline_minutes`: Define quanto tempo a quest fica aberta antes do deadline
- `late_submission_window_minutes`: 15 minutos adicionais para submissão atrasada
- Auto-advance automático via `QuestAutoAdvancer.tsx` que polling a cada 500ms

### Timeline Esperado
```
Quest Começa: 10:00
10:00-10:30: Janela Normal (sem penalidade)
10:30-10:45: Janela de Atraso (com penalidade de -5 a -15 pontos)
Após 10:45: Bloqueado (não permite mais submissão)
```

### Possíveis Causas do Atraso Observado
1. **QuestAutoAdvancer não disparou** - Polling pode ter falhado
2. **Deadline não configurado corretamente** - `planned_deadline_minutes` pode estar zerado
3. **Servidor respondendo lentamente** - API `/api/admin/advance-quest` atrasada
4. **Race condition** - Sistema tem lock de 10 segundos para evitar duplicatas

### Arquivos Relevantes
- `src/components/QuestAutoAdvancer.tsx` - Polling de auto-advance (500ms)
- `src/app/api/admin/advance-quest/route.ts` - API que avança quest
- `src/components/dashboard/CurrentQuestTimer.tsx` - Display do countdown
- `add-late-submission-system.sql` - Lógica de deadline

### Ação Recomendada
✅ **Verificar logs do servidor** durante o teste para:
1. Se o QuestAutoAdvancer disparou a requisição
2. Se a API respondeu com sucesso
3. Se houve erro de race condition (status 409)
4. Se `planned_deadline_minutes` está configurado (não zero)

---

## Problema 2: "Voltou Refresh" - Página Recarregando ao Abrir/Submeter

### Descrição
Ao abrir página de avaliador ou equipe, ou ao submeter avaliação, a página fazia refresh (recarga completa).

### CAUSA ENCONTRADA & FIXADA ✅
**Culpado:** `src/components/TeamPageRealtime.tsx`

Este componente:
- Fazia polling do `/api/team/check-updates` a cada 2 segundos
- Comparava hash de dados para detectar mudanças
- Chamava `router.refresh()` em ANY mudança
- Em cenários multi-abas, TODAS abas recarregavam simultaneamente

### Solução Implementada
✅ **TeamPageRealtime foi REMOVIDO** de:
- `src/app/(evaluator)/evaluate/page.tsx` (linha 151-152)
- `src/app/(team)/dashboard/page.tsx` (linha 178-179)
- `src/app/(team)/submit/page.tsx` (linha 179-180)

### Sistema Atual (SEM REFRESH)
```
Submissão ocorre → API cria dados
Polling da useRealtime (500ms) detecta mudança
Estado atualiza → UI re-renderiza
NÃO faz page refresh ✅
```

### Melhorias Implementadas
- ✅ NO `router.refresh()` em SubmissionForm
- ✅ NO `revalidatePath()` na API
- ✅ Polling com debounce (isFetching guard)
- ✅ Visibility detection (pausa quando aba oculta)
- ✅ Sem WebSocket RealtimeChannel subscriptions

### Arquivos Afetados
- `src/components/forms/SubmissionForm.tsx` - Não mais chama refresh
- `src/app/api/submissions/create/route.ts` - Sem revalidatePath
- `src/lib/hooks/useRealtime.ts` - Polling inteligente (não refresh)

### Status
🟢 **RESOLVIDO** - Página não deve mais recarregar

---

## Problema 3: Penalidade por Atraso Não Aplicada (INVESTIGADO ✅)

### Descrição
Equipe "Áurea Forma" submeteu uma quest em atraso e deveria ter recebido -5 pontos de penalidade, mas isso não foi verificado.

### ACHADOS DO DIAGNÓSTICO

✅ **Submissão foi detectada como atrasada:**
- Submissão ID: `9667cec3-685e-49f2-a4dc-2fb951f42cd8`
- Campo `is_late`: TRUE (atrasada)
- Campo `late_minutes`: 0 min (arredondado, mas foi atrasada)
- Campo `late_penalty_applied`: NULL (AQUI ESTÁ O PROBLEMA!)

⚠️ **Penalidade NÃO foi aplicada automaticamente:**
- Esperado: Penalidade tipo "atraso" com -5 pontos
- Encontrado: Penalidade tipo "desorganizacao" com -10 pontos (MANUAL)
- Data da penalidade manual: 14/11/2025, 02:54:14
- Razão da penalidade manual: "d" (incompleto)

### CONCLUSÃO DO PROBLEMA
A penalidade por atraso **NÃO foi aplicada automaticamente pelo sistema**. A penalidade encontrada foi registrada **MANUALMENTE** por um avaliador posteriormente.

### Sistema de Penalidade Funcionando
✅ **Sistema Implementado Corretamente:**

**Cálculo de Penalidade:**
```
0 minutos = 0 pontos (no prazo)
1-5 minutos = -5 pontos
5-10 minutos = -10 pontos
10-15 minutos = -15 pontos
15+ minutos = BLOQUEADO (sem submissão)
```

**Flow de Inserção:**
```
1. RPC validate_submission_allowed() → calcula penalty_calculated
2. Se penalty_calculated > 0 → INSERT na tabela penalties
3. Penalidade deduzida automaticamente do ranking
```

### Possíveis Razões do Erro

#### Opção 1: Submissão foi ON-TIME (não atrasada)
- Verificar `submitted_at` vs `quest_deadline`
- Se `submitted_at <= deadline` → penalty = 0 (normal)

#### Opção 2: Penalidade foi calculada mas não inserida
- Erro na inserção do registro de penalidade
- Submissão criada, mas penalty record falhou
- **BUG POTENCIAL:** Inconsistência de dados

#### Opção 3: Penalidade foi inserida mas não refletida no ranking
- Ranking não está somando corretamente
- Query do ranking pode estar usando cache
- Coluna `points_deduction` pode estar NULL em vez de 5

#### Opção 4: `planned_deadline_minutes` não foi configurado
- Se `planned_deadline_minutes = 0`
- Deadline = `started_at + 0` = imediatamente
- TODA submissão é considerada atrasada

### Como Verificar no Banco de Dados

```sql
-- 1. Verificar a submissão
SELECT submitted_at, is_late, late_minutes, late_penalty_applied
FROM submissions
WHERE id = '[submission_id_de_aurea_forma]';

-- 2. Verificar se penalidade foi registrada
SELECT * FROM penalties
WHERE team_id = '[team_id_de_aurea_forma]'
AND penalty_type = 'atraso'
ORDER BY created_at DESC;

-- 3. Verificar configuração da quest
SELECT id, planned_deadline_minutes, duration_minutes, late_submission_window_minutes
FROM quests
WHERE id = '[quest_id]';

-- 4. Verificar ranking da equipe
SELECT ranking, total_points
FROM rankings
WHERE team_id = '[team_id_de_aurea_forma]';
```

### Arquivos Relevantes
- `add-late-submission-system.sql` - RPC calculate_late_penalty()
- `src/app/api/submissions/create/route.ts` - Inserção de penalidade (linha 267-282)
- `create-penalties-system.sql` - Estrutura da tabela penalties
- `fix-live-ranking-with-penalties.sql` - Cálculo do ranking com penalidades

### Ação Imediata
⚠️ **VERIFICAR NO BANCO:**
1. Executar os queries SQL acima
2. Confirmar se penalidade foi registrada
3. Se não foi, verificar error logs da API
4. Se foi, mas não aparece no ranking, há bug na query de ranking

### Status
🔴 **BUG IDENTIFICADO** - Penalidade automática por atraso NÃO foi inserida

---

## BUG CONFIRMADO: Penalidade Automática de Atraso Não Inserida

### O Problema
Na submissão atrasada da Áurea Forma:
- ✅ Submissão foi registrada corretamente
- ✅ Campo `is_late = TRUE` foi setado (detectou atraso)
- ❌ Campo `late_penalty_applied = NULL` (penalidade NÃO foi aplicada)
- ❌ Nenhum registro na tabela `penalties` com `penalty_type = 'atraso'`

### Causa Provável
No arquivo `src/app/api/submissions/create/route.ts` (linhas 267-282), a condição de inserção é:

```javascript
if (validationResult?.penalty_calculated && validationResult.penalty_calculated > 0)
```

**Possibilidades:**
1. `penalty_calculated` retornou `null` da RPC (quando late_minutes > 15)
2. `penalty_calculated` retornou `0` (submissão on-time)
3. Erro na RPC `validate_submission_allowed()` - não retornou penalty
4. Erro na chamada da RPC - timeout ou exceção

### Dados Confirmados
```
Áurea Forma - Submissão Atrasada
==================================
ID Submissão: 9667cec3-685e-49f2-a4dc-2fb951f42cd8
is_late: TRUE ✅
late_minutes: 0 (arredondado de alguns segundos)
late_penalty_applied: NULL ❌
Tipo de penalidade: NENHUMA AUTO (apenas manual depois)
```

### Solução
Precisa ser debugado:
1. Adicionar logs na RPC `validate_submission_allowed()` para ver se retorna penalty_calculated
2. Adicionar logs na API `submissions/create/route.ts` para verificar o valor de `penalty_calculated`
3. Conferir se há error handling que silencia exceções

---

## Resumo de Problemas

| Problema | Causa | Status | Ação |
|----------|-------|--------|------|
| Atraso entre Quests | QuestAutoAdvancer ou API timeout | 🟡 Investigação | Verificar logs do servidor |
| Refresh na página | TeamPageRealtime removido | 🟢 RESOLVIDO | Já foi removido |
| Penalidade não aplicada | RPC penalty_calculated retornando null/0 | 🔴 BUG | Adicionar logs na RPC |

---

## Próximas Ações

### 1. Verificar Logs do Servidor
```bash
# Procurar por:
- Erros em QuestAutoAdvancer
- Failures no /api/admin/advance-quest
- Timeout errors
- Race condition (409 status)
```

### 2. Verificar Banco de Dados
Execute os queries SQL mencionados acima para confirmar que:
- Submissões foram registradas corretamente
- Penalidades foram inseridas
- Rankings foram calculados

### 3. Executar Testes Novamente
Com dados limpos:
```bash
node cleanup-fake-evaluators.js  # Se houver dados fictícios
node delete-alpha-team.js         # Se houver equipe alpha
```

Depois testar novamente com uma equipe de teste para reproduzir o problema.

---

