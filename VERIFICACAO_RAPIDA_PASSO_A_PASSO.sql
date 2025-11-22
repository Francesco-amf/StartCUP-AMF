-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔍 VERIFICAÇÃO RÁPIDA - PASSO A PASSO
-- ═══════════════════════════════════════════════════════════════════════════════
-- Execute CADA BLOCO separadamente (um de cada vez) no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1️⃣ VERIFICAR FUNÇÃO auto_advance_phase()
-- ═══════════════════════════════════════════════════════════════════════════════
-- Copie e execute APENAS este bloco:

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'auto_advance_phase' AND n.nspname = 'public'
    ) THEN '✅ Função auto_advance_phase() EXISTE'
    ELSE '❌ Função auto_advance_phase() NÃO ENCONTRADA'
  END as "Status";

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2️⃣ VERIFICAR SISTEMA BOSS (Estrutura)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Copie e execute APENAS este bloco:

SELECT 
  p.order_index as "Fase",
  COUNT(CASE WHEN q.order_index = 4 THEN 1 END) as "Tem Quest 4?",
  COUNT(CASE WHEN q.order_index = 4 AND q.deliverable_type LIKE '%presentation%' THEN 1 END) as "É BOSS?",
  CASE 
    WHEN p.order_index <= 4 THEN
      CASE 
        WHEN COUNT(CASE WHEN q.order_index = 4 AND q.deliverable_type LIKE '%presentation%' THEN 1 END) = 1 
        THEN '✅ BOSS configurado'
        ELSE '❌ FALTA BOSS'
      END
    ELSE
      CASE 
        WHEN COUNT(CASE WHEN q.order_index = 4 THEN 1 END) = 0 
        THEN '✅ Fase 5 SEM BOSS'
        ELSE '❌ Fase 5 NÃO DEVE TER Quest 4'
      END
  END as "Status"
FROM phases p
LEFT JOIN quests q ON q.phase_id = p.id
GROUP BY p.order_index
ORDER BY p.order_index;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3️⃣ VERIFICAR PROTEÇÃO BOSS no SQL
-- ═══════════════════════════════════════════════════════════════════════════════
-- Copie e execute APENAS este bloco:

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'auto_start_next_quest' 
        AND n.nspname = 'public'
        AND (
          pg_get_functiondef(p.oid) LIKE '%order_index = 4%' OR
          pg_get_functiondef(p.oid) LIKE '%presentation%'
        )
    ) THEN '✅ TEM proteção contra ativar BOSS'
    ELSE '❌ NÃO TEM proteção BOSS (CRÍTICO!)'
  END as "Proteção BOSS SQL";

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4️⃣ VERIFICAR TIMESTAMPS
-- ═══════════════════════════════════════════════════════════════════════════════
-- Copie e execute APENAS este bloco:

SELECT 
  current_phase as "Fase Atual",
  CASE WHEN phase_1_start_time IS NOT NULL THEN '✅' ELSE '❌' END as "F1",
  CASE WHEN phase_2_start_time IS NOT NULL THEN '✅' ELSE '⏳' END as "F2",
  CASE WHEN phase_3_start_time IS NOT NULL THEN '✅' ELSE '⏳' END as "F3",
  CASE WHEN phase_4_start_time IS NOT NULL THEN '✅' ELSE '⏳' END as "F4",
  CASE WHEN phase_5_start_time IS NOT NULL THEN '✅' ELSE '⏳' END as "F5",
  event_started as "Iniciado",
  event_ended as "Encerrado"
FROM event_config;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5️⃣ VERIFICAR TOTAL DE QUESTS
-- ═══════════════════════════════════════════════════════════════════════════════
-- Copie e execute APENAS este bloco:

SELECT 
  COUNT(*) as "Total",
  CASE 
    WHEN COUNT(*) = 15 THEN '✅ 15 quests (correto)'
    ELSE '❌ Deveria ter 15, tem ' || COUNT(*)
  END as "Status"
FROM quests;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6️⃣ RESUMO POR FASE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Copie e execute APENAS este bloco:

SELECT 
  p.order_index as "F",
  COUNT(q.id) as "Quests",
  SUM(q.duration_minutes) as "Min Total",
  STRING_AGG(
    CONCAT(
      'Q', q.order_index, ':', q.duration_minutes, 'min',
      CASE WHEN q.deliverable_type LIKE '%presentation%' THEN '[BOSS]' ELSE '' END
    ),
    ' | ' ORDER BY q.order_index
  ) as "Detalhes"
FROM phases p
LEFT JOIN quests q ON q.phase_id = p.id
GROUP BY p.order_index
ORDER BY p.order_index;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7️⃣ VALIDAÇÃO FINAL (RESUMO)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Copie e execute APENAS este bloco:

WITH validations AS (
  SELECT 
    (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
     WHERE p.order_index BETWEEN 1 AND 4 AND q.order_index = 4 
     AND q.deliverable_type LIKE '%presentation%') = 4 as boss_ok,
    (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
     WHERE p.order_index = 5 AND q.order_index = 4) = 0 as fase5_ok,
    (SELECT COUNT(*) FROM quests) = 15 as total_ok,
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_advance_phase') as func_ok
)
SELECT 
  CASE WHEN boss_ok THEN '✅' ELSE '❌' END || ' BOSS Fases 1-4' as "Check 1",
  CASE WHEN fase5_ok THEN '✅' ELSE '❌' END || ' Fase 5 sem BOSS' as "Check 2",
  CASE WHEN total_ok THEN '✅' ELSE '❌' END || ' Total: 15 quests' as "Check 3",
  CASE WHEN func_ok THEN '✅' ELSE '❌' END || ' auto_advance_phase()' as "Check 4",
  CASE 
    WHEN boss_ok AND fase5_ok AND total_ok AND func_ok 
    THEN '✅✅✅ TUDO OK! ✅✅✅'
    ELSE '⚠️ Verificar itens com ❌'
  END as "RESULTADO FINAL"
FROM validations;
