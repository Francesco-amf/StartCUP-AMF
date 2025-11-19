require('dotenv').config({ path: '.env.local' });

async function testDirectSQL() {
  console.log('🧪 Testando UPDATE direto via SQL...\n');
  
  const pg = require('pg');
  const { Pool } = pg;
  
  // Criar conexão direta com Postgres
  const connectionString = process.env.POSTGRES_CONNECTION_STRING || 
    `postgresql://postgres:[YOUR-PASSWORD]@db.yourproject.supabase.co:5432/postgres`;
  
  if (!process.env.POSTGRES_CONNECTION_STRING) {
    console.log('⚠️ POSTGRES_CONNECTION_STRING não configurada no .env.local');
    console.log('   Você pode obter ela em: Supabase Dashboard > Project Settings > Database > Connection String');
    console.log('   Adicione em .env.local: POSTGRES_CONNECTION_STRING=postgresql://...');
    return;
  }
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL\n');
    
    // Buscar Quest 5.3
    const selectResult = await client.query(`
      SELECT id, order_index, name, status, started_at
      FROM quests
      WHERE phase_id = 5 AND order_index = 3
    `);
    
    const quest = selectResult.rows[0];
    console.log('Quest 5.3:');
    console.log(`  ID: ${quest.id}`);
    console.log(`  Status: ${quest.status}`);
    console.log(`  started_at: ${quest.started_at}\n`);
    
    // Tentar UPDATE direto com SQL
    console.log('📝 Executando UPDATE direto com SQL...');
    const updateResult = await client.query(`
      UPDATE quests
      SET status = 'active', started_at = NOW()
      WHERE id = $1
      RETURNING id, name, status, started_at
    `, [quest.id]);
    
    if (updateResult.rowCount > 0) {
      const updated = updateResult.rows[0];
      console.log('✅ UPDATE funcionou!');
      console.log(`  Status: ${updated.status}`);
      console.log(`  started_at: ${updated.started_at}\n`);
      
      // Reverter
      await client.query(`
        UPDATE quests
        SET status = 'scheduled', started_at = NULL
        WHERE id = $1
      `, [quest.id]);
      console.log('↩️ Revertido para scheduled\n');
    } else {
      console.log('❌ Nenhuma linha atualizada\n');
    }
    
    client.release();
    console.log('✅ Teste concluído!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

testDirectSQL().catch(console.error);
