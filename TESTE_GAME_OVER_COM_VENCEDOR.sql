-- ============================================================
-- TESTE GAME OVER COM VENCEDOR - StartCup AMF
-- ============================================================
-- Como usar: Execute estes comandos no Supabase Dashboard > SQL Editor
-- para testar o sistema de Game Over com exibição do vencedor

-- ============================================================
-- PASSO 1: VERIFICAR ESTRUTURA
-- ============================================================
-- Verificar se event_end_time existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'event_config' 
AND column_name = 'event_end_time';

-- Se não existir, criar:
ALTER TABLE event_config 
ADD COLUMN IF NOT EXISTS event_end_time TIMESTAMP WITH TIME ZONE;

-- ============================================================
-- PASSO 2: VERIFICAR VENCEDOR ATUAL
-- ============================================================
-- Ver quem está em primeiro lugar
SELECT 
  team_name,
  total_points,
  'VENCEDOR ATUAL 🏆' as status
FROM live_ranking
ORDER BY total_points DESC
LIMIT 1;

-- Ver top 3
SELECT 
  ROW_NUMBER() OVER (ORDER BY total_points DESC) as posicao,
  team_name,
  total_points,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY total_points DESC) = 1 THEN '🥇 PRIMEIRO'
    WHEN ROW_NUMBER() OVER (ORDER BY total_points DESC) = 2 THEN '🥈 SEGUNDO'
    WHEN ROW_NUMBER() OVER (ORDER BY total_points DESC) = 3 THEN '🥉 TERCEIRO'
  END as medalha
FROM live_ranking
ORDER BY total_points DESC
LIMIT 3;

-- ============================================================
-- TESTE 1: COUNTDOWN DE 15 SEGUNDOS + VENCEDOR
-- ============================================================
-- Define evento para terminar em 15 segundos
UPDATE event_config
SET 
  event_ended = false,
  event_end_time = NOW() + INTERVAL '15 seconds'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- O que esperar:
-- ⏱️  0-5 segundos: Nada acontece (aguardando)
-- ⏱️  5 segundos restantes: Aparece texto "EVENTO TERMINANDO"
-- ⏱️  10-1 segundos: Contagem regressiva com números gigantes
-- ⏱️  0 segundos: GAME OVER + busca automática do vencedor
-- 🏆 Exibição do vencedor com:
--    - Troféu dourado animado 🏆
--    - Nome da equipe vencedora
--    - Pontuação final
--    - Confetes caindo (🎉🎊✨)
--    - Brilho dourado animado

-- ============================================================
-- TESTE 2: GAME OVER IMEDIATO COM VENCEDOR
-- ============================================================
-- Ativa GAME OVER instantaneamente
UPDATE event_config
SET event_ended = true
WHERE id = '00000000-0000-0000-0000-000000000001';

-- O que esperar:
-- ✅ GAME OVER aparece imediatamente
-- ✅ Vencedor é carregado automaticamente
-- ✅ Animações completas (confetes, brilho, troféu)

-- ============================================================
-- TESTE 3: RESETAR PARA NORMAL
-- ============================================================
-- Voltar ao estado normal do evento
UPDATE event_config
SET 
  event_ended = false,
  event_end_time = NOW() + INTERVAL '24 hours'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- O que esperar:
-- ✅ Tela de GAME OVER desaparece
-- ✅ Evento volta ao normal
-- ✅ Equipes podem continuar enviando submissões

-- ============================================================
-- TESTE 4: SIMULAR EMPATE (DESEMPATE POR ORDEM ALFABÉTICA)
-- ============================================================
-- Criar empate artificial para testar desempate
-- ATENÇÃO: Isso modifica dados reais! Use com cuidado.

-- Ver equipes com mesma pontuação
SELECT 
  team_name,
  total_points
FROM live_ranking
WHERE total_points = (
  SELECT total_points 
  FROM live_ranking 
  ORDER BY total_points DESC 
  LIMIT 1
)
ORDER BY team_name;

-- Em caso de empate, o sistema escolhe automaticamente
-- a primeira equipe retornada pela query (ordem alfabética)

-- ============================================================
-- TESTE 5: TESTE COMPLETO COM PREPARAÇÃO
-- ============================================================

-- 5.1: Garantir que há dados de teste
SELECT COUNT(*) as total_equipes FROM teams WHERE name != 'Admin';
SELECT COUNT(*) as total_submissions FROM submissions WHERE status = 'evaluated';
SELECT COUNT(*) as total_ajustes FROM coin_adjustments;

-- 5.2: Ver ranking completo antes do Game Over
SELECT 
  ROW_NUMBER() OVER (ORDER BY total_points DESC) as posicao,
  team_name,
  total_points
FROM live_ranking
ORDER BY total_points DESC;

-- 5.3: Ativar countdown de 20 segundos
UPDATE event_config
SET 
  event_ended = false,
  event_end_time = NOW() + INTERVAL '20 seconds'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Observação: Abra múltiplas abas do navegador
-- Todas devem sincronizar e mostrar o vencedor simultaneamente

-- ============================================================
-- VERIFICAÇÃO PÓS-TESTE
-- ============================================================

-- Verificar estado atual do evento
SELECT 
  id,
  event_started,
  event_ended,
  event_end_time,
  CASE 
    WHEN event_ended THEN '🏁 TERMINADO'
    WHEN event_end_time IS NULL THEN '⏳ SEM HORA MARCADA'
    WHEN event_end_time < NOW() THEN '⏱️ TEMPO EXPIRADO'
    ELSE '✅ ATIVO'
  END as status,
  CASE 
    WHEN event_end_time > NOW() THEN 
      EXTRACT(EPOCH FROM (event_end_time - NOW()))::INTEGER || ' segundos restantes'
    ELSE 
      'N/A'
  END as tempo_restante
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================================
-- TROUBLESHOOTING
-- ============================================================

-- Problema: Nenhum vencedor aparece
-- Solução: Verificar se há equipes no ranking
SELECT COUNT(*) FROM live_ranking;

-- Problema: Vencedor errado
-- Solução: Executar FIX_LIVE_RANKING_DUPLICATE_BUG.sql primeiro
SELECT * FROM live_ranking ORDER BY total_points DESC LIMIT 5;

-- Problema: Countdown não aparece
-- Solução: Verificar se event_end_time está no futuro
SELECT event_end_time, NOW(), event_end_time > NOW() as futuro FROM event_config;

-- ============================================================
-- DICAS DE TESTE
-- ============================================================

-- 1. Teste em diferentes dispositivos (desktop, mobile, tablet)
-- 2. Teste com múltiplas abas abertas (devem sincronizar)
-- 3. Teste com diferentes fusos horários (UTC handling)
-- 4. Teste som de game over (verificar se arquivo existe em /sounds/)
-- 5. Verifique animações em navegadores diferentes
-- 6. Teste com e sem equipes no sistema

-- ============================================================
-- DADOS DE EXEMPLO PARA TESTE
-- ============================================================

-- Criar equipes de teste se não existirem
DO $$
BEGIN
  -- Inserir apenas se não houver equipes
  IF (SELECT COUNT(*) FROM teams WHERE name != 'Admin') < 3 THEN
    INSERT INTO teams (id, name, auth_user_id) VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Equipe Alpha', '00000000-0000-0000-0000-000000000000'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Equipe Beta', '00000000-0000-0000-0000-000000000000'),
      ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Equipe Gamma', '00000000-0000-0000-0000-000000000000')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Adicionar pontos de teste (opcional)
-- ATENÇÃO: Isso modifica dados reais!
/*
INSERT INTO coin_adjustments (team_id, amount, reason, adjusted_by)
SELECT 
  id,
  FLOOR(RANDOM() * 500)::INTEGER,
  'Teste de ranking',
  '00000000-0000-0000-0000-000000000000'
FROM teams
WHERE name != 'Admin'
LIMIT 3
ON CONFLICT DO NOTHING;
*/
