// ==========================================
// RENOMEAR EQUIPES E ATUALIZAR CREDENCIAIS
// ==========================================
// Executar: node rename-teams.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas!')
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function renameTeams() {
  console.log('🔄 Iniciando renomeação de equipes...\n')

  try {
    // ==========================================
    // 1. EQUIPE MISTOS.COM → MISTOS
    // ==========================================
    console.log('📝 Atualizando: Equipe Mistos.com → Mistos')
    
    const { data: mistosTeam, error: mistosError } = await supabase
      .from('teams')
      .update({
        name: 'Mistos',
        email: 'mistos@startcup-amf.com'
      })
      .eq('email', 'mistoscom@startcup-amf.com')
      .select()

    if (mistosError) {
      console.error('❌ Erro ao atualizar Mistos:', mistosError.message)
    } else if (mistosTeam && mistosTeam.length > 0) {
      console.log('✅ Equipe Mistos atualizada com sucesso!')
      console.log('   - Nome: Mistos')
      console.log('   - Email: mistos@startcup-amf.com')
      console.log('   ⚠️  ATENÇÃO: Senha deve ser atualizada manualmente no Supabase Auth!')
    } else {
      console.log('⚠️  Equipe Mistos.com não encontrada (email: mistoscom@startcup-amf.com)')
    }

    console.log('')

    // ==========================================
    // 2. EQUIPE VISIONONE → KONNECTART
    // ==========================================
    console.log('📝 Atualizando: Equipe VisionOne → KonnectArt')
    
    const { data: konnectTeam, error: konnectError } = await supabase
      .from('teams')
      .update({
        name: 'KonnectArt',
        email: 'konnectart@startcup-amf.com'
      })
      .eq('email', 'visionone@startcup-amf.com')
      .select()

    if (konnectError) {
      console.error('❌ Erro ao atualizar KonnectArt:', konnectError.message)
    } else if (konnectTeam && konnectTeam.length > 0) {
      console.log('✅ Equipe KonnectArt atualizada com sucesso!')
      console.log('   - Nome: KonnectArt')
      console.log('   - Email: konnectart@startcup-amf.com')
      console.log('   ⚠️  ATENÇÃO: Senha deve ser atualizada manualmente no Supabase Auth!')
    } else {
      console.log('⚠️  Equipe VisionOne não encontrada (email: visionone@startcup-amf.com)')
    }

    console.log('\n✅ Processo concluído!')
    console.log('\n⚠️  PRÓXIMO PASSO: Atualizar senhas no Supabase Auth Dashboard')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('1. Acesse: https://supabase.com/dashboard')
    console.log('2. Vá em: Authentication → Users')
    console.log('3. Busque: mistoscom@startcup-amf.com')
    console.log('   - Clique em ••• → Update User')
    console.log('   - Mude email para: mistos@startcup-amf.com')
    console.log('   - Defina nova senha: Mistos@2894!')
    console.log('4. Busque: visionone@startcup-amf.com')
    console.log('   - Clique em ••• → Update User')
    console.log('   - Mude email para: konnectart@startcup-amf.com')
    console.log('   - Defina nova senha: KonnectArt@5193!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('❌ Erro fatal:', error.message)
    process.exit(1)
  }
}

renameTeams()
