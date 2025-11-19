Require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TRIGGER_SQL = `
-- Drop trigger e função se existirem
DROP TRIGGER IF EXISTS auto_set_quest_started_at ON quests;
DROP FUNCTION IF EXISTS set_quest_started_at_on_activate();

-- Criar função que preenche started_at automaticamente
CREATE OR REPLACE FUNCTION set_quest_started_at_on_activate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se status mudou para 'active' E started_at ainda está NULL
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') AND NEW.started_at IS NULL THEN
    NEW.started_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger BEFORE UPDATE
CREATE TRIGGER auto_set_quest_started_at
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION set_quest_started_at_on_activate();
`;

async function createTrigger() {
  console.log('🔧 Criando trigger auto_set_quest_started_at...\n');
  console.log('SQL a ser executado:');
  console.log('='.repeat(60));
  console.log(TRIGGER_SQL);
  console.log('='.repeat(60));
  console.log('\n⚠️ ATENÇÃO: Este script precisa ser executado via Supabase SQL Editor');
  console.log('📋 Siga estes passos:\n');
  console.log('1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
  console.log('2. Cole o SQL acima no editor');
  console.log('3. Execute (clique em "Run")');
  console.log('4. Volte aqui e execute: node test-trigger.js\n');
}

createTrigger().catch(console.error);
