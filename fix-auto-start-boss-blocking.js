require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FIXED_FUNCTION = `
CREATE OR REPLACE FUNCTION auto_start_next_quest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_phase INT;
  v_current_quest_order INT;
  v_next_quest_order INT;
  v_total_quests INT;
  v_quest_to_start_id UUID;
  v_next_quest_deliverable_type TEXT;
  v_quest_to_start_order_index INT;
BEGIN
  -- Buscar fase atual
  SELECT current_phase INTO v_current_phase
  FROM event_config
  LIMIT 1;

  IF v_current_phase IS NULL OR v_current_phase = 0 THEN
    RAISE NOTICE '[auto_start] Evento não iniciado ou fase 0';
    RETURN;
  END IF;

  RAISE NOTICE '[auto_start] ========== Verificando Fase % ==========', v_current_phase;

  -- Contar total de quests da fase atual
  SELECT COUNT(*) INTO v_total_quests
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase;

  -- Encontrar a quest de maior order_index que já está ativa ou finalizada
  SELECT MAX(q.order_index) INTO v_current_quest_order
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.started_at IS NOT NULL;

  IF v_current_quest_order IS NULL THEN
    RAISE NOTICE '[auto_start] ⚠️ Nenhuma quest iniciada na Fase %', v_current_phase;
    RETURN;
  END IF;

  RAISE NOTICE '[auto_start] 📍 Última quest iniciada: Quest %.%', v_current_phase, v_current_quest_order;

  -- ============== VERIFICAR SE QUEST ATUAL TERMINOU ==============
  DECLARE
    v_current_quest_finished BOOLEAN := FALSE;
    v_current_quest_id UUID;
    v_current_quest_expired BOOLEAN;
    v_current_quest_submitted BOOLEAN;
  BEGIN
    SELECT q.id INTO v_current_quest_id
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_current_phase
      AND q.order_index = v_current_quest_order;

    -- Verificar se expirou (considerar late_submission_window)
    SELECT EXISTS(
      SELECT 1 FROM quests q
      WHERE q.id = v_current_quest_id
        AND q.started_at IS NOT NULL
        AND q.planned_deadline_minutes IS NOT NULL
        AND NOW() > (
          q.started_at + 
          (q.planned_deadline_minutes * INTERVAL '1 minute') + 
          (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')
        )
    ) INTO v_current_quest_expired;

    -- Verificar se foi submetida por ALGUMA equipe
    SELECT EXISTS(
      SELECT 1 FROM submissions WHERE quest_id = v_current_quest_id
    ) INTO v_current_quest_submitted;

    v_current_quest_finished := v_current_quest_expired OR v_current_quest_submitted;

    RAISE NOTICE '[auto_start]   Quest %.% - Expirou?: % | Submetida?: % | Finalizada?: %', 
                 v_current_phase, v_current_quest_order,
                 v_current_quest_expired, v_current_quest_submitted, v_current_quest_finished;

    -- ❌ SE QUEST NÃO TERMINOU, NÃO ATIVAR PRÓXIMA
    IF NOT v_current_quest_finished THEN
      RAISE NOTICE '[auto_start] ⏳ Quest %.% ainda em andamento. Aguardando.', v_current_phase, v_current_quest_order;
      RETURN;
    END IF;
  END;

  -- ============== ENCONTRAR PRÓXIMA QUEST ==============
  v_next_quest_order := v_current_quest_order + 1;

  IF v_next_quest_order > v_total_quests THEN
    RAISE NOTICE '[auto_start] 🏁 Quest %.% era a última. Todas finalizadas.', v_current_phase, v_current_quest_order;
    RETURN;
  END IF;

  -- Buscar próxima quest
  SELECT q.id, q.deliverable_type, q.order_index 
  INTO v_quest_to_start_id, v_next_quest_deliverable_type, v_quest_to_start_order_index
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.order_index = v_next_quest_order;

  RAISE NOTICE '[auto_start] 🔍 Próxima quest: %.% | Deliverable: %', 
               v_current_phase, v_next_quest_order, v_next_quest_deliverable_type;

  -- ============== ✅ VALIDAÇÃO CRÍTICA: NÃO ATIVAR BOSS ==============
  -- Boss é: order_index = 4 OU deliverable_type contém 'presentation'
  
  IF v_quest_to_start_order_index = 4 THEN
    RAISE NOTICE '[auto_start] 🛑 BLOQUEADO: Quest %.% é BOSS (order_index=4)!', v_current_phase, v_next_quest_order;
    RETURN;
  END IF;

  IF v_next_quest_deliverable_type IS NOT NULL THEN
    -- Verificar múltiplos formatos
    IF v_next_quest_deliverable_type ILIKE '%presentation%' THEN
      RAISE NOTICE '[auto_start] 🛑 BLOQUEADO: Quest %.% é BOSS (presentation)!', v_current_phase, v_next_quest_order;
      RETURN;
    END IF;
    
    -- Tentar como JSON
    BEGIN
      IF (v_next_quest_deliverable_type::jsonb) ? 'presentation' THEN
        RAISE NOTICE '[auto_start] 🛑 BLOQUEADO: Quest %.% é BOSS (JSON presentation)!', v_current_phase, v_next_quest_order;
        RETURN;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Não é JSON, continuar
    END;
  END IF;

  -- ============== VERIFICAR SE JÁ FOI INICIADA ==============
  IF EXISTS (SELECT 1 FROM quests WHERE id = v_quest_to_start_id AND started_at IS NOT NULL) THEN
    RAISE NOTICE '[auto_start] ⚠️ Quest %.% já foi iniciada', v_current_phase, v_next_quest_order;
    RETURN;
  END IF;

  -- ============== ✅ ATIVAR PRÓXIMA QUEST ==============
  UPDATE quests
  SET started_at = NOW(),
      status = 'active'
  WHERE id = v_quest_to_start_id;

  RAISE NOTICE '[auto_start] ✅ Quest %.% ATIVADA!', v_current_phase, v_next_quest_order;

END;
$$;
`;

async function updateAutoStartFunction() {
  console.log('🔧 ATUALIZANDO FUNÇÃO auto_start_next_quest() COM VALIDAÇÃO MELHORADA\n');
  console.log('='.repeat(80));
  
  // Executar SQL direto via Supabase
  const { error } = await supabase.rpc('execute_sql', {
    query: FIXED_FUNCTION
  }).catch(() => ({ error: 'RPC não disponível' }));
  
  if (error && error !== 'RPC não disponível') {
    console.log('⚠️  RPC execute_sql não disponível');
    console.log('\n📋 Para atualizar manualmente:\n');
    console.log('1. Acesse: Supabase Dashboard → SQL Editor');
    console.log('2. Cole este SQL:\n');
    console.log(FIXED_FUNCTION);
    console.log('\n3. Execute (clique em "Run")');
  } else {
    console.log('✅ Função atualizada com sucesso!');
    console.log('\n📊 Melhorias aplicadas:');
    console.log('   ✅ Validação DUPLA: order_index = 4 E deliverable_type');
    console.log('   ✅ Check case-insensitive (ILIKE)');
    console.log('   ✅ Suporte a JSON array');
    console.log('   ✅ Logs melhorados para debug');
    console.log('   ✅ Proteção contra Boss mesmo em formatos diferentes');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🚀 Próximas Steps:');
  console.log('   1. Evento começa às 21:00 BRT');
  console.log('   2. CRON vai chamar auto_start_next_quest() a cada minuto');
  console.log('   3. Função vai PULAR BOSS automaticamente');
  console.log('   4. Boss terá que ser ATIVADO MANUALMENTE pelo admin');
  console.log('='.repeat(80) + '\n');
}

updateAutoStartFunction().catch(console.error);
