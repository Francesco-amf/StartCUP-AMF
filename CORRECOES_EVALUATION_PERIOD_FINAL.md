# 🔧 Correções Finais: Evaluation Period

## 📋 Resumo dos Problemas

1. ❌ **Página verde "AVALIAÇÕES CONCLUÍDAS"** aparece muito cedo
2. ❌ **Timer zera muito rápido** antes do período de avaliação terminar
3. ❌ **Live dashboard fica presa em GAME OVER** após refresh
4. ❌ **RPC `check_all_submissions_evaluated()`** retorna `all_evaluated: true` incorretamente

---

## 🎯 Causa Raiz

O RPC estava **contando TODAS as submissões do evento inteiro** em vez de apenas a Fase 5.

Quando não há submissões da Fase 5 ainda (a fase acaba de iniciar), o RPC retorna:
```
all_evaluated: true ❌ (ERRADO!)
total_submissions: 0
evaluated_submissions: 0
pending_submissions: 0
```

Isso causa:
- EventEndCountdownWrapper recebe `all_evaluated: true`
- Pula direto para página verde de sucesso
- Depois mostra GAME OVER

---

## ✅ Solução em 3 Passos

### PASSO 1: Corrigir o RPC (CRÍTICO)

Execute no Supabase SQL Editor:

```sql
-- ============================================================================
-- CORRIGIR RPC check_all_submissions_evaluated
-- ============================================================================

-- 1. Deletar RPC antigo
DROP FUNCTION IF EXISTS check_all_submissions_evaluated();

-- 2. Criar novo RPC corrigido (conta apenas Fase 5)
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
    -- CORRIGIDO: retorna true APENAS se há submissões E todas estão avaliadas
    -- Se não há submissões (phase 5 começou agora), retorna false
    (COUNT(*) > 0 AND COUNT(*) FILTER (WHERE s.status = 'pending') = 0)::BOOLEAN as all_evaluated
  FROM submissions s
  JOIN quests q ON s.quest_id = q.id
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 5;  -- ← NOVO: Apenas Fase 5
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Testar o RPC
SELECT 'RPC Testado' as resultado;
```

**O Que Mudou:**
- ✅ Agora conta apenas submissões da Fase 5 (não o evento inteiro)
- ✅ Retorna `all_evaluated: false` quando não há submissões
- ✅ Retorna `all_evaluated: true` APENAS quando há submissões E todas foram avaliadas

---

### PASSO 2: Desabilitar Triggers Conflitantes

Se você ainda tem o trigger automático ativo, desabilite:

```sql
ALTER TABLE event_config DISABLE TRIGGER start_evaluation_period_trigger;
```

(Seu endpoint `advance-quest` já faz isso automaticamente)

---

### PASSO 3: Limpar Estado do Banco (Preparar para Teste)

```sql
-- Resetar event_config para teste novo
UPDATE event_config
SET
  event_ended = false,
  event_end_time = NULL,
  evaluation_period_end_time = NULL,
  all_submissions_evaluated = false
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verificar resultado
SELECT
  evaluation_period_end_time,
  all_submissions_evaluated,
  event_ended
FROM event_config;
```

---

## 🧪 Teste Completo (Com Debugging)

Depois de aplicar as correções:

### 1. Abrir Console (F12)

Procure por esses logs quando 5.3 terminar:

```
📊 [EventEndCountdownWrapper] Carregado estado do evento:
  evaluation_period_end_time: "2025-11-11T16:30:00.000Z"
  all_submissions_evaluated: false ← ✅ IMPORTANTE

📋 [EvaluationPeriodCountdown] Config carregado:
  evaluation_period_end_time: "2025-11-11T16:30:00.000Z"
  all_submissions_evaluated: false

📊 [EvaluationPeriodCountdown] RPC result:
  total_submissions: 0 (ou mais se há submissões)
  evaluated_submissions: 0
  pending_submissions: 0
  all_evaluated: false ← ✅ CRÍTICO (deve ser false)
```

### 2. Sequência Esperada (6 minutos)

```
[Minuto 0-2] 5.1 rodando
  └─ Logs normais de polling

[Minuto 2-4] 5.2 rodando
  └─ Logs normais de polling

[Minuto 4-6] 5.3 rodando
  └─ Logs normais de polling

[Minuto 6] 5.3 expira
  ✅ Terminal: "⏰ Período de avaliação: [timestamp]"
  ✅ Console: "📊 [EvaluationPeriodCountdown] RPC result: all_evaluated: false"
  ✅ Live Dashboard: Fundo AZUL/ROXO, timer 00:30 (Evaluation Period)

[Minuto 6-6.5] Evaluation Period (30 seg em teste)
  ✅ Timer contando: 00:29, 00:28, ...
  ✅ Mostrando: "AVALIAÇÕES FINAIS EM ANDAMENTO"

[Minuto 6.5-7] Final Countdown (30 seg em teste)
  ✅ Fundo VERMELHO, timer contando
  ✅ Mostrando: "O evento terminará em 30 segundos"

[Minuto 7] Game Over
  ✅ Fundo PRETO/VERMELHO
  ✅ Mostrando: "GAME OVER 🏁"
```

### 3. Se Aparecer Página Verde Errada

**Significa:** RPC ainda está retornando `all_evaluated: true`

**Solução:**
1. Execute o script SQL de correção do RPC novamente
2. Resetar event_config
3. Testar de novo

---

## 🐛 Debug Se Algo Ainda Não Funcionar

### Problema: "Página verde aparece no minuto 6"

**Verificar:**
```sql
-- Ver o que o RPC está retornando
SELECT * FROM check_all_submissions_evaluated();

-- Esperado:
-- total: 0 (ou mais)
-- all_evaluated: false
```

Se `all_evaluated: true`, o RPC não foi corrigido corretamente.

### Problema: "GAME OVER aparece e não sai nem com refresh"

**Causa:** `event_ended = true` está setado

**Verificar:**
```sql
SELECT event_ended FROM event_config;
```

Se `true`, resetar:
```sql
UPDATE event_config SET event_ended = false;
```

### Problema: "Timer zera muito rápido"

**Verificar:**
1. Abra Console (F12)
2. Procure por logs `EvaluationPeriodCountdown`
3. Veja qual timestamp está sendo usado
4. Se for no passado, há problema de sincronização de relógio

---

## 📝 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/EventEndCountdownWrapper.tsx` | Adicionado logging para debug |
| `src/components/EvaluationPeriodCountdown.tsx` | Adicionado logging para debug |
| SQL: `FIX_RPC_EVALUATION_CORRIGIDO.sql` | RPC corrigido (crítico!) |

---

## ✅ Checklist Final

Antes de testar:

```
☐ 1. Execute FIX_RPC_EVALUATION_CORRIGIDO.sql em Supabase
☐ 2. Execute DESABILITAR_CONFLITO_TRIGGER.sql em Supabase
☐ 3. Resetar event_config (UPDATE com values NULL)
☐ 4. npm run build localmente (deve compilar sem erros)
☐ 5. Abrir F12 Console antes de começar
☐ 6. Ir para Control Panel e começar Phase 5
☐ 7. Aguardar ~6 minutos
☐ 8. Verificar logs no Console durante transições
☐ 9. Confirmar sequência: Evaluation Period → Countdown → GAME OVER
```

---

## 🚀 Próximas Ações

**1. Teste a sequência completa** com as correções

**2. Se tudo funcionar:**
   - Build final
   - Deploy para produção
   - Testar com dados reais do evento

**3. Se houver problemas:**
   - Coloque screenshots dos logs do console aqui
   - Mostre o resultado do `SELECT * FROM check_all_submissions_evaluated();`
   - Mostre o resultado do `SELECT event_ended, evaluation_period_end_time, all_submissions_evaluated FROM event_config;`

---

## 💡 Por Que Isso Funciona Agora

**Antes (RPC quebrado):**
```
Fase 5 começa → 0 submissões ainda
RPC retorna: all_evaluated: true ❌
Frontend pula para GAME OVER
```

**Depois (RPC corrigido):**
```
Fase 5 começa → 0 submissões ainda
RPC retorna: all_evaluated: false ✅ (porque COUNT(*) = 0)
Frontend mostra Evaluation Period
Aguarda pendências reais
Quando terminar período, vai para countdown
Countdown termina, vai para GAME OVER
```
