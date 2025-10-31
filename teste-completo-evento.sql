-- ==========================================
-- TESTE COMPLETO DO SISTEMA DE EVENTOS
-- ==========================================

-- PASSO 1: Verificar se event_config existe
SELECT
  '=== PASSO 1: Verificar Tabela ===' as etapa;

SELECT
  'Tabela event_config existe?' as pergunta,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'event_config'
  ) as resposta;

-- PASSO 2: Mostrar dados atuais
SELECT
  '=== PASSO 2: Dados Atuais ===' as etapa;

SELECT
  id,
  event_name,
  current_phase,
  event_started,
  event_ended,
  event_start_time,
  phase_1_start_time,
  updated_at
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- PASSO 3: Forçar início do evento
SELECT
  '=== PASSO 3: Forçando Início ===' as etapa;

UPDATE event_config
SET
  current_phase = 1,
  event_started = true,
  event_ended = false,
  event_start_time = NOW(),
  phase_1_start_time = NOW(),
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- PASSO 4: Verificar resultado
SELECT
  '=== PASSO 4: Resultado Final ===' as etapa;

SELECT
  id,
  event_name,
  current_phase,
  event_started,
  event_ended,
  event_start_time,
  phase_1_start_time,
  updated_at,
  CASE
    WHEN event_started = true AND event_ended = false THEN '🔥 Evento em Andamento'
    WHEN event_started = false THEN '⏸️ Aguardando Início'
    WHEN event_ended = true THEN '🏁 Evento Encerrado'
  END as status_display
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- PASSO 5: Verificar RLS
SELECT
  '=== PASSO 5: Políticas RLS ===' as etapa;

SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN cmd = 'SELECT' THEN '✅ Leitura'
    WHEN cmd = 'UPDATE' THEN '✏️ Atualização'
    WHEN cmd = 'INSERT' THEN '➕ Inserção'
    WHEN cmd = 'DELETE' THEN '🗑️ Deleção'
  END as tipo
FROM pg_policies
WHERE tablename = 'event_config'
ORDER BY cmd, policyname;
