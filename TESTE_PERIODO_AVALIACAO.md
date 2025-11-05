# 🧪 Guia de Teste: Período de Avaliação e Vencedor Correto

## 📋 Pré-requisitos

1. ✅ Executar `FIX_PERIODO_AVALIACAO.sql` no Supabase
2. ✅ Código frontend atualizado (componentes criados)
3. ✅ Evento com pelo menos 1 quest ativa

---

## 🎯 Teste 1: Fluxo Completo (Avaliações Rápidas)

### Objetivo
Verificar que o sistema pula período de espera se todas as submissões forem avaliadas rapidamente.

### Passo a Passo

**1. Preparar dados de teste**
```sql
-- Criar 3 submissões pendentes
INSERT INTO submissions (quest_id, team_id, status, max_points, submitted_at)
SELECT 
  (SELECT id FROM quests WHERE order_index = 3 AND phase_id = (SELECT id FROM phases WHERE order_index = 5)),
  id,
  'pending',
  100,
  NOW()
FROM teams
WHERE name != 'Admin'
LIMIT 3;

-- Verificar
SELECT * FROM check_all_submissions_evaluated();
-- Esperado: total=3, evaluated=0, pending=3, all_evaluated=false
```

**2. Simular fim da última quest**
```sql
-- Definir event_end_time para agora (dispara período de avaliação)
UPDATE event_config
SET event_end_time = NOW();

-- Aguardar 2 segundos
SELECT pg_sleep(2);

-- Verificar que período foi iniciado
SELECT 
  evaluation_period_end_time,
  all_submissions_evaluated,
  evaluation_period_end_time - NOW() as tempo_restante
FROM event_config;

-- Esperado: 
-- - evaluation_period_end_time = NOW() + 15 minutos
-- - all_submissions_evaluated = false
```

**3. Ver tela de "Avaliações em Andamento"**
- Abrir Live Dashboard
- **Esperado:** Tela roxa/azul com ⏳
- Timer mostrando 15:00 (contagem regressiva)
- Barra de progresso: 0% (0 de 3 avaliadas)

**4. Avaliar UMA submissão**
```sql
UPDATE submissions
SET status = 'evaluated', final_points = max_points
WHERE status = 'pending'
LIMIT 1;
```

- **Aguardar 30 segundos** (para job verificar)
- **Esperado:** Barra atualiza para 33% (1 de 3)

**5. Avaliar TODAS as submissões**
```sql
UPDATE submissions
SET status = 'evaluated', final_points = max_points
WHERE status = 'pending';
```

- **Aguardar 30 segundos**
- **Esperado:** 
  - Tela muda para ✅ "AVALIAÇÕES CONCLUÍDAS!"
  - Após 3 segundos → Countdown 10s
  - Após countdown → GAME OVER + Vencedor

**Resultado Esperado:** Sistema pulou os 15 minutos e foi direto para Game Over após avaliações.

---

## 🎯 Teste 2: Timeout (15 Minutos Completos)

### Objetivo
Verificar que sistema continua após 15 minutos mesmo com submissões pendentes.

### Passo a Passo

**1. Reduzir período de teste (para não esperar 15 min)**
```sql
-- Modificar função para usar 2 minutos em vez de 15 (apenas teste!)
CREATE OR REPLACE FUNCTION start_evaluation_period()
RETURNS TRIGGER AS $$
DECLARE
  v_has_pending BOOLEAN;
BEGIN
  IF NEW.event_end_time IS NOT NULL 
     AND OLD.event_end_time IS NOT NULL
     AND OLD.event_end_time > NOW() 
     AND NEW.event_end_time <= NOW() 
     AND NEW.evaluation_period_end_time IS NULL THEN
    
    SELECT EXISTS(
      SELECT 1 FROM submissions WHERE status = 'pending'
    ) INTO v_has_pending;
    
    IF v_has_pending THEN
      -- TESTE: Usar 2 minutos em vez de 15
      NEW.evaluation_period_end_time := NOW() + INTERVAL '2 minutes';
      NEW.all_submissions_evaluated := false;
      
      RAISE NOTICE '⏳ [TESTE] Período de 2 minutos iniciado';
    ELSE
      NEW.all_submissions_evaluated := true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**2. Criar submissões pendentes**
```sql
INSERT INTO submissions (quest_id, team_id, status, max_points, submitted_at)
SELECT 
  (SELECT id FROM quests LIMIT 1),
  id,
  'pending',
  100,
  NOW()
FROM teams
WHERE name != 'Admin'
LIMIT 2;
```

**3. Iniciar período de avaliação**
```sql
UPDATE event_config
SET event_end_time = NOW();
```

**4. NÃO avaliar nenhuma submissão**
- Apenas aguardar

**5. Após 2 minutos**
- **Esperado:**
  - Aviso: "⚠️ Tempo de avaliação expirado"
  - "Prosseguindo com 2 submissões pendentes..."
  - Após 2 segundos → Countdown 10s
  - GAME OVER + Vencedor (mesmo com pendências)

**Resultado Esperado:** Sistema não fica travado esperando avaliações infinitamente.

---

## 🎯 Teste 3: Vencedor Correto (Cenário Real)

### Objetivo
Garantir que vencedor só é calculado APÓS todas as avaliações.

### Passo a Passo

**1. Setup: Criar cenário de "vencedor falso"**
```sql
-- Equipe A: 400 pontos (já avaliados)
INSERT INTO coin_adjustments (team_id, amount, reason)
VALUES (
  (SELECT id FROM teams WHERE name = 'Equipe A'),
  400,
  'Pontos de quests anteriores'
);

-- Equipe B: 300 pontos avaliados + 200 pendentes = 500 total
INSERT INTO coin_adjustments (team_id, amount, reason)
VALUES (
  (SELECT id FROM teams WHERE name = 'Equipe B'),
  300,
  'Pontos de quests anteriores'
);

-- Submissão PENDENTE da Equipe B (+200 pontos quando avaliar)
INSERT INTO submissions (
  quest_id, 
  team_id, 
  status, 
  max_points, 
  final_points,
  submitted_at
)
VALUES (
  (SELECT id FROM quests LIMIT 1),
  (SELECT id FROM teams WHERE name = 'Equipe B'),
  'pending',
  200,
  NULL, -- Ainda não avaliado
  NOW()
);
```

**2. Ver ranking ANTES de avaliar**
```sql
SELECT team_name, total_points
FROM live_ranking
ORDER BY total_points DESC
LIMIT 3;

-- Esperado:
-- Equipe A: 400 pontos (VENCEDOR FALSO!)
-- Equipe B: 300 pontos
```

**3. Simular fim do evento SEM o novo sistema**
❌ **PROBLEMA:** Se Game Over aparecer agora, Equipe A seria declarada vencedora!

**4. Com o novo sistema: Iniciar período de avaliação**
```sql
UPDATE event_config
SET event_end_time = NOW();
```

- **Tela mostra:** "AVALIAÇÕES EM ANDAMENTO"
- Barra: 0 de 1 pendente

**5. Avaliar submissão da Equipe B**
```sql
UPDATE submissions
SET status = 'evaluated', final_points = max_points
WHERE team_id = (SELECT id FROM teams WHERE name = 'Equipe B')
AND status = 'pending';
```

**6. Ver ranking DEPOIS de avaliar**
```sql
SELECT team_name, total_points
FROM live_ranking
ORDER BY total_points DESC
LIMIT 3;

-- Esperado:
-- Equipe B: 500 pontos (VENCEDOR CORRETO! ✅)
-- Equipe A: 400 pontos
```

**7. Aguardar 30 segundos (job detecta)**
- **Tela muda:** ✅ "AVALIAÇÕES CONCLUÍDAS"
- Countdown 10s
- GAME OVER
- **🏆 VENCEDOR: EQUIPE B (500 pontos)** ✅

**Resultado Esperado:** Vencedor correto exibido após TODAS as avaliações.

---

## 🎯 Teste 4: Realtime Sync (Múltiplas Abas)

### Objetivo
Verificar que todas as abas sincronizam durante período de avaliação.

### Passo a Passo

**1. Abrir 3 abas do navegador**
- Aba 1: Live Dashboard
- Aba 2: Live Dashboard
- Aba 3: Live Dashboard

**2. Iniciar período de avaliação**
```sql
-- Criar submissões pendentes
INSERT INTO submissions (quest_id, team_id, status, max_points, submitted_at)
SELECT 
  (SELECT id FROM quests LIMIT 1),
  id,
  'pending',
  100,
  NOW()
FROM teams
WHERE name != 'Admin'
LIMIT 3;

-- Disparar período
UPDATE event_config
SET event_end_time = NOW();
```

**3. Verificar sincronização inicial**
- **Esperado:** TODAS as 3 abas mostram simultaneamente:
  - Tela de "AVALIAÇÕES EM ANDAMENTO"
  - Timer: 15:00
  - Barra: 0%

**4. Avaliar 1 submissão (em outra janela)**
```sql
UPDATE submissions
SET status = 'evaluated', final_points = max_points
WHERE status = 'pending'
LIMIT 1;
```

**5. Aguardar 30 segundos**
- **Esperado:** TODAS as 3 abas atualizam para:
  - Barra: 33% (1 de 3)
  - Pendentes: 2

**6. Avaliar resto**
```sql
UPDATE submissions
SET status = 'evaluated', final_points = max_points
WHERE status = 'pending';
```

**7. Aguardar 30 segundos**
- **Esperado:** TODAS as 3 abas simultaneamente:
  - Mostram ✅ "AVALIAÇÕES CONCLUÍDAS"
  - Iniciam countdown 10s (sincronizado)
  - Mostram GAME OVER + Vencedor (ao mesmo tempo)

**Resultado Esperado:** Sincronização perfeita via Realtime.

---

## 🎯 Teste 5: Força Manual (Emergência)

### Objetivo
Verificar que organizador pode forçar fim do período manualmente.

### Passo a Passo

**1. Iniciar período com pendências**
```sql
-- Criar pendentes
INSERT INTO submissions (quest_id, team_id, status, max_points, submitted_at)
SELECT (SELECT id FROM quests LIMIT 1), id, 'pending', 100, NOW()
FROM teams WHERE name != 'Admin' LIMIT 2;

-- Disparar
UPDATE event_config SET event_end_time = NOW();
```

**2. Aguardar começar (ver tela de avaliação)**

**3. Forçar fim manualmente**
```sql
SELECT force_end_evaluation_period();
```

**4. Verificar resultado**
- **Esperado:** 
  - Tela muda imediatamente para ✅ "CONCLUÍDO"
  - Prossegue para Game Over
  - Aviso de submissões pendentes (se houver)

**Resultado Esperado:** Organizador tem controle manual em emergências.

---

## 📊 Verificações de Segurança

### Query de Monitoramento (Rodar Durante Testes)

```sql
-- Ver status completo em tempo real
SELECT 
  status as estado,
  total_submissions as total,
  evaluated_submissions as avaliadas,
  pending_submissions as pendentes,
  percentual_avaliado as progresso,
  segundos_restantes / 60 as minutos_restantes
FROM evaluation_period_status;
```

### Checklist de Validação

Após cada teste, verificar:

- [ ] Período iniciou corretamente (evaluation_period_end_time definido)
- [ ] Timer conta regressiva de 15 minutos
- [ ] Barra de progresso atualiza a cada 30s
- [ ] Flag `all_submissions_evaluated` muda para true quando tudo avaliado
- [ ] Sistema pula para Game Over quando flag = true
- [ ] Sistema prossegue após 15 min mesmo com pendências
- [ ] Vencedor exibido está correto (após todas avaliações)
- [ ] Realtime sincroniza todas as abas
- [ ] Força manual funciona

---

## 🚨 Troubleshooting

### Problema: Timer não aparece

**Verificar:**
```sql
SELECT evaluation_period_end_time FROM event_config;
```

- Se NULL: Trigger não disparou
- **Solução:** Verificar se há submissões pendentes antes de disparar

### Problema: Barra não atualiza

**Verificar:**
```sql
SELECT * FROM cron.job WHERE jobname = 'check-evaluations-complete';
```

- Se não existe: Job não foi criado
- **Solução:** Executar parte 4 do SQL novamente

### Problema: Flag não muda para true

**Verificar:**
```sql
SELECT * FROM check_all_submissions_evaluated();
```

- Se `all_evaluated = false` mas `pending = 0`: Job não rodou ainda
- **Solução:** Aguardar 30 segundos ou executar UPDATE manualmente

### Problema: Frontend não atualiza

**Verificar no console do navegador:**
```javascript
// Verificar se Realtime está conectado
console.log('Realtime status:', channel.state)
```

- Se disconnected: Problema de conexão
- **Solução:** Recarregar página

---

## ✅ Critérios de Sucesso

Testes passam se:

1. ✅ Período de avaliação inicia automaticamente quando evento termina
2. ✅ Timer de 15 minutos visível e funcional
3. ✅ Barra de progresso atualiza conforme avaliações
4. ✅ Sistema pula para Game Over quando tudo avaliado (< 15 min)
5. ✅ Sistema prossegue após 15 min mesmo com pendências
6. ✅ Vencedor exibido é SEMPRE correto (após todas avaliações)
7. ✅ Múltiplas abas sincronizam perfeitamente
8. ✅ Força manual funciona em emergências

---

**Próximo Passo:** Executar testes em ordem (1 → 5) e validar cada um! 🚀
