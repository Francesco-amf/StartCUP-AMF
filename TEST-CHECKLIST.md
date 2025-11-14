# Checklist de Testes - Validação das Correções

## ✅ Teste 1: Verificar Penalidade Automática (CORRIGIDO)

### Setup
```bash
# 1. Resetar dados de teste (opcional)
node cleanup-fake-evaluators.js
node delete-alpha-team.js
```

### Execução
- [ ] Criar uma **nova quest** com:
  - Nome: "Teste de Penalidade"
  - planned_deadline_minutes: **2**
  - late_submission_window_minutes: 1

- [ ] Iniciar a quest
- [ ] **Esperar 2.5 minutos** (após o deadline)
- [ ] Uma equipe submete a resposta (será marcada como atrasada)
- [ ] Verificar **logs do servidor** por:
  ```
  Validation Result (parsed): { ..., penalty_calculated: 5, ... }
  Applying penalty of: 5
  Penalidade inserida com sucesso
  ```

### Verificação no Banco
```sql
-- 1. Submissão foi marcada como atrasada?
SELECT
  id, is_late, late_minutes, late_penalty_applied
FROM submissions
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 1;

-- Esperado: is_late=TRUE, late_penalty_applied=5

-- 2. Penalidade foi criada?
SELECT
  id, team_id, penalty_type, points_deduction, reason
FROM penalties
WHERE created_at > NOW() - INTERVAL '10 minutes'
AND penalty_type = 'atraso'
ORDER BY created_at DESC
LIMIT 1;

-- Esperado: penalty_type='atraso', points_deduction=5
```

### Resultado
- [ ] ✅ is_late = TRUE
- [ ] ✅ late_penalty_applied = 5 (ou 10/15 conforme minutos)
- [ ] ✅ Registro em penalties com penalty_type='atraso'
- [ ] ✅ Logs mostram "Penalidade inserida com sucesso"

---

## ✅ Teste 2: Verificar Refresh na Página (RESOLVIDO)

### Execução
- [ ] Abrir dashboard de uma equipe
- [ ] Clicar para submeter uma resposta
- [ ] Preencher o formulário
- [ ] Clicar em "Submeter"

### Verificação
- [ ] ✅ Página **NÃO faz refresh** (não pisca, não recarrega)
- [ ] ✅ Formulário desaparece
- [ ] ✅ Mensagem de sucesso aparece
- [ ] ✅ Dados atualizam via polling (não via refresh)
- [ ] ✅ Sem erros no console

---

## 🟡 Teste 3: Investigar Atraso entre Quests

### Preparação
- [ ] Verificar `planned_deadline_minutes` de todas as quests:
```sql
SELECT order_index, description, planned_deadline_minutes
FROM quests
ORDER BY order_index;

-- Esperado: todas > 0
-- Se houver 0, está BUGADO
```

### Execução
- [ ] Uma equipe começa a fazer as quests
- [ ] Quando deadline expira, observar se próxima quest ativa automaticamente
- [ ] Capturar **logs do servidor** durante transição

### Logs para Procurar
```
-- Sucesso:
Calling /api/admin/advance-quest
Quest avançada com sucesso
Próxima quest ativada: [quest_id]

-- Falha:
Erro ao avancar quest
Timeout em advance-quest
Race condition detected (409)
```

### Resultado
- [ ] Se sucesso: ✅ Quest avançou em tempo
- [ ] Se falha: 🔴 Investigar logs e planned_deadline_minutes

---

## 📋 Teste 4: Verificar Pontuação com Penalidade

### Execução
- [ ] Completar um cenário com:
  - 1 submissão **no prazo** (100 pontos)
  - 1 submissão **atrasada 3 min** (-5 penalidade)

### Verificação no Banco
```sql
-- Calcular pontuação esperada
SELECT
  team_id,
  SUM(CASE WHEN final_points IS NOT NULL THEN final_points ELSE 0 END) as total_from_submissions,
  COALESCE(SUM(p.points_deduction), 0) as total_penalties,
  (SUM(CASE WHEN final_points IS NOT NULL THEN final_points ELSE 0 END)
   - COALESCE(SUM(p.points_deduction), 0)) as final_score
FROM submissions s
LEFT JOIN penalties p ON s.team_id = p.team_id
WHERE s.created_at > NOW() - INTERVAL '1 hour'
GROUP BY team_id;

-- Esperado:
-- total_from_submissions = 200 (100 + 100)
-- total_penalties = 5 (penalidade atraso)
-- final_score = 195 (200 - 5)
```

### Resultado
- [ ] ✅ Penalidade está sendo subtraída
- [ ] ✅ Score final está correto

---

## 🔧 Teste 5: Verificar Logs da API

### Durante Submissão Atrasada, Logs Devem Conter:

```
[SUBMISSÃO INICIADA]
team_id: [uuid]
quest_id: [uuid]
deliverable_type: text/file

[PASSO 1: VALIDAÇÃO]
Validation Results: [{ is_allowed: true, penalty_calculated: 5, ... }]
Validation Result (parsed): { is_allowed: true, penalty_calculated: 5, ... }
penalty_calculated: 5
is_allowed: true

[PASSO 2: SEQUÊNCIA]
Sequential check passed

[SUBMISSÃO CRIADA]
Submission ID: [uuid]
submitted_at: [timestamp]

[PASSO 8: PENALIDADE]
Checking penalty application:
  validationResult?.penalty_calculated: 5
  is > 0: true
  will apply: true
Applying penalty of: 5
Penalidade inserida com sucesso

[RESPOSTA]
{
  success: true,
  submission: { ... },
  penalty: { applied: true, amount: 5 }
}
```

### Checklist
- [ ] ✅ Validation Result contém penalty_calculated
- [ ] ✅ "Checking penalty application" mostra true
- [ ] ✅ "Applying penalty of: 5" aparece
- [ ] ✅ "Penalidade inserida com sucesso" aparece

---

## 🚀 Teste Final: Cenário Completo

### Contexto
- 1 Equipe
- 3 Quests com deadline de 2 minutos cada
- Submeter: On-time, 3 min late, 11 min late

### Execução
1. [ ] Equipe faz quest 1 **no prazo** → 100 pts
2. [ ] Equipe faz quest 2 **3 min atrasada** → 100 pts - 5 penalty = 95 pts
3. [ ] Equipe tenta fazer quest 3 **11 min atrasada** → Penalidade de -15 pts

### Verificação Final
```sql
SELECT
  team_id,
  COUNT(*) as submissoes,
  SUM(final_points) as submissao_pontos,
  COALESCE(SUM(p.points_deduction), 0) as penalidades,
  (SUM(final_points) - COALESCE(SUM(p.points_deduction), 0)) as score_final
FROM submissions s
LEFT JOIN penalties p ON s.team_id = p.team_id
GROUP BY team_id;
```

### Resultado Esperado
```
submissoes: 3
submissao_pontos: 300 (100+100+100)
penalidades: 20 (5+15)
score_final: 280
```

- [ ] ✅ Resultado matches expected

---

## 📊 Status de Cada Teste

| Teste | Descrição | Status | Pass/Fail |
|-------|-----------|--------|-----------|
| 1 | Penalidade automática | 🟢 Corrigido | [ ] / [ ] |
| 2 | Sem refresh na página | 🟢 Resolvido | [ ] / [ ] |
| 3 | Atraso entre quests | 🟡 Investigar | [ ] / [ ] |
| 4 | Pontuação com penalidade | 🟢 Corrigido | [ ] / [ ] |
| 5 | Logs da API | 🟢 Adicionado | [ ] / [ ] |
| Final | Cenário completo | 🟢 Pronto | [ ] / [ ] |

---

## ⚠️ Se Algum Teste Falhar

### Falha em Teste 1 (Penalidade não inserida)
```bash
# Verificar logs
tail -f /var/log/app.log | grep "Penalidade"

# Verificar RPC
SELECT validate_submission_allowed(
  '[team_uuid]'::uuid,
  '[quest_uuid]'::uuid
);

# Verificar trigger
SELECT * FROM submissions
WHERE late_minutes > 0
LIMIT 1;
```

### Falha em Teste 2 (Página faz refresh)
```bash
# Verificar se TeamPageRealtime foi removido
grep -r "TeamPageRealtime" src/

# Não deve encontrar nada!
# Se encontrar, precisará remover manualmente
```

### Falha em Teste 3 (Quest não avança)
```bash
# Verificar planned_deadline_minutes
SELECT id, planned_deadline_minutes FROM quests;

# Se algum for 0, atualizar:
UPDATE quests SET planned_deadline_minutes = 5 WHERE planned_deadline_minutes = 0;

# Verificar logs de advance-quest
tail -f /var/log/app.log | grep "advance-quest"
```

---

## ✅ Protocolo de Aprovação

Quando todos os testes passarem:

1. [ ] Documentar resultados
2. [ ] Fazer commit das correções
3. [ ] Deploy em staging
4. [ ] Teste de smoke (verificação rápida)
5. [ ] Deploy em produção
6. [ ] Monitorar logs por 24h

---

