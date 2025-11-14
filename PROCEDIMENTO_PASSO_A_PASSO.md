# 📋 PROCEDIMENTO PASSO A PASSO: Reconstruir Fase 5 + Testar

## PASSO 1: Reconstruir Fase 5 no Banco
===============================================

**AÇÃO:**
1. Abra Supabase Dashboard
2. Vá para: **SQL Editor**
3. Copie TUDO do arquivo: **RECONSTRUIR_FASE_5_COMPLETA.sql**
4. Cole no SQL Editor do Supabase
5. Clique: **RUN**

**ESPERADO:**
```
✅ FASE 5 RECRIADA COM SUCESSO
✅ 4 quests criadas
✅ Total de 500 pontos
```

---

## PASSO 2: Resetar event_config
===============================================

**AÇÃO:**
1. No SQL Editor, copie e execute:

```sql
UPDATE event_config
SET
  event_ended = false,
  event_end_time = NULL,
  evaluation_period_end_time = NULL,
  all_submissions_evaluated = false,
  current_phase = 0
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**ESPERADO:**
```
✅ 1 row updated
```

---

## PASSO 3: Desabilitar Trigger
===============================================

**AÇÃO:**
1. No SQL Editor, copie e execute:

```sql
ALTER TABLE event_config DISABLE TRIGGER start_evaluation_period_trigger;
```

**ESPERADO:**
```
✅ No output (sucesso silencioso)
```

---

## PASSO 4: Testar RPC (CRÍTICO!)
===============================================

**AÇÃO:**
1. No SQL Editor, execute:

```sql
SELECT * FROM check_all_submissions_evaluated();
```

**ESPERADO:**
```
✅ total_submissions: 0 ou mais
✅ evaluated_submissions: 0 ou mais
✅ pending_submissions: 0 ou mais
✅ all_evaluated: FALSE ← CRÍTICO! Não pode ser TRUE
```

**SE `all_evaluated = TRUE`:**

Corrigir RPC:

```sql
DROP FUNCTION IF EXISTS check_all_submissions_evaluated();

CREATE OR REPLACE FUNCTION check_all_submissions_evaluated()
RETURNS TABLE(
  total_submissions BIGINT,
  evaluated_submissions BIGINT,
  pending_submissions BIGINT,
  all_evaluated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_submissions,
    COUNT(*) FILTER (WHERE s.status = 'evaluated')::BIGINT as evaluated_submissions,
    COUNT(*) FILTER (WHERE s.status = 'pending')::BIGINT as pending_submissions,
    (COUNT(*) > 0 AND COUNT(*) FILTER (WHERE s.status = 'pending') = 0)::BOOLEAN as all_evaluated
  FROM submissions s
  JOIN quests q ON s.quest_id = q.id
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Depois teste novamente.

---

## PASSO 5: Build Local
===============================================

**AÇÃO:**
1. Abra Terminal/PowerShell
2. Navegue:
```bash
cd c:\Users\symbi\Desktop\startcup-amf\startcup-amf
```

3. Execute:
```bash
npm run build
```

**ESPERADO:**
```
✅ ✓ Compiled successfully in X.Xs
✅ ✓ Generating static pages (29/29)
```

---

## PASSO 6: Testar Sequência
===============================================

### SETUP:

1. Abra 2 janelas do navegador:
   - **Janela 1:** `http://localhost:3000/control-panel`
   - **Janela 2:** `http://localhost:3000/live-dashboard`

2. Abra F12 Developer Tools na Janela 2 (Console)

3. Abra Terminal para ver logs do servidor

### AÇÃO:

1. Em **Janela 1** (Control Panel):
   - Procure por "Fase 5: Pitch Final"
   - Clique "Start Phase" (botão verde)

2. Em **Janela 2** (Live Dashboard):
   - Observar quest 5.1 aparecer com timer
   - Abrir F12 Console
   - Ver logs de EventEndCountdownWrapper

3. Em **Terminal**:
   - Ver logs de quest advancement

### TIMELINE ESPERADA (Modo Teste - 1 minuto):

```
[00:00] Fase 5 iniciou
  ├─ Terminal: Logs normais
  ├─ Console: Vazio
  └─ Dashboard: Quest 5.1 ativa

[00:20] Quest 5.1 expira
  ├─ Terminal: "🔵 ADVANCE-QUEST ENDPOINT CALLED"
  ├─ Console: Logs de atualização
  └─ Dashboard: Quest 5.2 ativa

[00:35] Quest 5.2 expira
  ├─ Terminal: "🔵 ADVANCE-QUEST ENDPOINT CALLED"
  ├─ Console: Logs de atualização
  └─ Dashboard: Quest 5.3 ativa

[00:50] Quest 5.3 expira
  ├─ Terminal: "🔵 ADVANCE-QUEST ENDPOINT CALLED"
  ├─ Console: Logs de atualização
  └─ Dashboard: Quest 5.4 (BOSS) ativa

[01:00] Quest 5.4 expira ← MOMENTO CRÍTICO!
  ├─ Terminal: "⏰ Período de avaliação: [timestamp]"
  ├─ Terminal: "⏰ Evento terminará em: [timestamp]"
  ├─ Console: "📊 [EventEndCountdownWrapper] Carregado estado..."
  ├─ Console: evaluation_period_end_time setado
  ├─ Console: "all_submissions_evaluated: false"
  └─ Dashboard: 🎯 FUNDO AZUL/ROXO
               🎯 "AVALIAÇÕES FINAIS EM ANDAMENTO"
               🎯 TIMER 00:30

✅ SE CHEGAR AQUI, TUDO FUNCIONANDO!

[01:30] Evaluation Period termina
  ├─ Console: "🟠 FASE 2: Final Countdown"
  └─ Dashboard: 🎯 FUNDO VERMELHO
               🎯 TIMER 00:30

[02:00] Countdown termina
  ├─ Console: "🏁 FASE 3: GAME OVER"
  └─ Dashboard: 🎯 FUNDO PRETO/VERMELHO
               🎯 "GAME OVER"
               🎯 BOTÃO "REVELAR VENCEDOR"

[02:00+] User clica botão
  └─ Dashboard: 🎯 "O VENCEDOR DO JOGO É..."
               🎯 TIMER 15 segundos
               🎯 AUDIO: suspense

[02:15+] Winner revelado
  └─ Dashboard: 🎯 NOME DO VENCEDOR
               🎯 PONTOS TOTAIS
               🎯 CONFETTI
```

---

## PASSO 7: Validação Final
===============================================

**Validar no SQL Editor:**

### 1. Fase 5 existe?
```sql
SELECT * FROM phases WHERE order_index = 5;
```
✅ Deve retornar **1 row**

### 2. 4 Quests criadas?
```sql
SELECT order_index, name, max_points
FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5)
ORDER BY order_index;
```
✅ Deve retornar **4 rows**:
```
1 | Quest 5.1... | 100
2 | Quest 5.2... | 100
3 | Quest 5.3... | 100
4 | Quest 5.4... | 200 ← IMPORTANTE!
```

### 3. Total de pontos?
```sql
SELECT SUM(max_points)
FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5);
```
✅ Deve retornar **500**

### 4. Types corretos?
```sql
SELECT order_index, array_to_string(deliverable_type, ',')
FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5)
ORDER BY order_index;
```
✅ Deve retornar:
```
1 | file
2 | file
3 | file
4 | presentation ← CRÍTICO!
```

---

## 🚨 TROUBLESHOOTING
===============================================

### ❌ PROBLEMA: "Evaluation Period não aparece após Quest 5.4"

**SOLUÇÃO:**
1. Verificar console (F12) para erros JavaScript
2. Verificar terminal para erros SQL
3. Testar RPC:
   ```sql
   SELECT * FROM check_all_submissions_evaluated();
   ```
4. Verificar que `evaluation_period_end_time` foi setado:
   ```sql
   SELECT evaluation_period_end_time FROM event_config;
   ```

---

### ❌ PROBLEMA: "Game Over fica preso mesmo com refresh"

**SOLUÇÃO:**
```sql
UPDATE event_config SET event_ended = false;
```
Depois refresh a página e tente novamente.

---

### ❌ PROBLEMA: "RPC retorna all_evaluated = TRUE quando deveria ser FALSE"

**SOLUÇÃO:**
1. Executar fix do RPC (PASSO 4)
2. Verificar que filtra corretamente:
   ```sql
   SELECT * FROM check_all_submissions_evaluated();
   ```

---

## ✅ SUCESSO!
===============================================

Se chegou até aqui com tudo funcionando:

✅ Fase 5 reconstruída
✅ Evaluation Period funcionando
✅ Countdown funcionando
✅ Game Over funcionando
✅ Winner revelation funcionando

**Próximos passos para produção:**
1. Alterar duração de teste para produção (change 30s to minutes)
2. Deploy para servidor de produção
3. Executar evento com dados reais
