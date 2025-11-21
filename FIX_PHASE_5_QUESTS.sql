-- ============================================================================
-- FIX PHASE 5 QUESTS - Corrigir discrepâncias entre DB e Guia do Avaliador
-- ============================================================================
-- Issue: Quest 5.3 shows "Vídeo Pitch (30s)" but should show "Ensaio Geral (5 minutos)"
-- Quest 5.1 and 5.2 also have incorrect data
-- 
-- Fonte de verdade: src/app/guia-avaliador/page.tsx lines 686-737
-- ============================================================================

-- Primeiro, verificar dados atuais
SELECT 
  order_index,
  name,
  description,
  max_points,
  duration_minutes
FROM quests
WHERE phase_id = 5
ORDER BY order_index;

-- ============================================================================
-- OPÇÃO 1: UPDATE dos 3 quests da Fase 5
-- ============================================================================

-- Quest 5.1 - A História Épica (CORRIGIR)
UPDATE quests
SET 
  name = 'Quest 5.1 - A História Épica',
  description = 'Estruturar narrativa do pitch + storytelling da solução (Pitch de 5 minutos)',
  max_points = 75,
  duration_minutes = 20,
  planned_deadline_minutes = 20,
  late_submission_window_minutes = 15,
  deliverable_type = '["file"]'
WHERE phase_id = 5 AND order_index = 1;

-- Quest 5.2 - Slides de Impacto (AJUSTAR max_points)
UPDATE quests
SET 
  name = 'Quest 5.2 - Slides de Impacto',
  description = 'Criar apresentação visual, sequência de slides: Capa → Dor/Necessidade → Solução → Mercado → Faturamento → Livre',
  max_points = 50,
  duration_minutes = 40,
  planned_deadline_minutes = 40,
  late_submission_window_minutes = 15,
  deliverable_type = '["file","url"]'
WHERE phase_id = 5 AND order_index = 2;

-- Quest 5.3 - Ensaio Geral (CORRIGIR COMPLETAMENTE)
UPDATE quests
SET 
  name = 'Quest 5.3 - Ensaio Geral',
  description = 'Treinar pitch + ajustar timing (5 minutos)',
  max_points = 25,
  duration_minutes = 30,
  planned_deadline_minutes = 30,
  late_submission_window_minutes = 15,
  deliverable_type = '["file"]'
WHERE phase_id = 5 AND order_index = 3;

-- Verificar resultados
SELECT 
  order_index,
  name,
  description,
  max_points,
  duration_minutes,
  deliverable_type
FROM quests
WHERE phase_id = 5
ORDER BY order_index;

-- ============================================================================
-- RESUMO DAS MUDANÇAS
-- ============================================================================
/*
Quest 5.1:
  ANTES: "Documento Executivo" + "Documento executivo de 2 páginas..." + 100pts
  DEPOIS: "A História Épica" + "Estruturar narrativa do pitch (5 minutos)" + 75pts

Quest 5.2:
  ANTES: "Slides de Pitch" + max_points=100
  DEPOIS: "Slides de Impacto" + max_points=50 (descrição mantida similar)

Quest 5.3:
  ANTES: "Vídeo Pitch (30s)" + "Vídeo de pitch de 30 segundos" + 100pts
  DEPOIS: "Ensaio Geral" + "Treinar pitch + ajustar timing (5 minutos)" + 25pts
  
IMPACTO: Corrige erro crítico que mostrava "30 segundos" quando deveria ser "5 minutos"
*/
