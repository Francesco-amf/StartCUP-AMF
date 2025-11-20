// ==========================================
// ATUALIZAR EMAILS E SENHAS NO SUPABASE AUTH
// ==========================================
// Executar: node update-auth-users.js

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

async function updateAuthUsers() {
  console.log('🔄 Atualizando usuários no Supabase Auth...\n')

  try {
    // ==========================================
    // 1. ATUALIZAR MISTOS.COM → MISTOS
    // ==========================================
    console.log('📝 Buscando usuário: mistoscom@startcup-amf.com')
    
    // Buscar usuário pelo email antigo
    const { data: users1, error: listError1 } = await supabase.auth.admin.listUsers()
    
    if (listError1) {
      console.error('❌ Erro ao listar usuários:', listError1.message)
      return
    }
    
    const mistosUser = users1.users.find(u => u.email === 'mistoscom@startcup-amf.com')
    
    if (!mistosUser) {
      console.log('⚠️  Usuário mistoscom@startcup-amf.com não encontrado no Auth')
    } else {
      console.log(`✅ Usuário encontrado (ID: ${mistosUser.id})`)
      console.log('   Atualizando email e senha...')
      
      const { data: updatedMistos, error: updateError1 } = await supabase.auth.admin.updateUserById(
        mistosUser.id,
        {
          email: 'mistos@startcup-amf.com',
          password: 'Mistos@2894!',
          email_confirm: true
        }
      )
      
      if (updateError1) {
        console.error('❌ Erro ao atualizar Mistos:', updateError1.message)
      } else {
        console.log('✅ Usuário Mistos atualizado com sucesso!')
        console.log('   - Email: mistos@startcup-amf.com')
        console.log('   - Senha: Mistos@2894!')
      }
    }

    console.log('')

    // ==========================================
    // 2. ATUALIZAR VISIONONE → KONNECTART
    // ==========================================
    console.log('📝 Buscando usuário: visionone@startcup-amf.com')
    
    const { data: users2, error: listError2 } = await supabase.auth.admin.listUsers()
    
    if (listError2) {
      console.error('❌ Erro ao listar usuários:', listError2.message)
      return
    }
    
    const visionUser = users2.users.find(u => u.email === 'visionone@startcup-amf.com')
    
    if (!visionUser) {
      console.log('⚠️  Usuário visionone@startcup-amf.com não encontrado no Auth')
    } else {
      console.log(`✅ Usuário encontrado (ID: ${visionUser.id})`)
      console.log('   Atualizando email e senha...')
      
      const { data: updatedVision, error: updateError2 } = await supabase.auth.admin.updateUserById(
        visionUser.id,
        {
          email: 'konnectart@startcup-amf.com',
          password: 'KonnectArt@5193!',
          email_confirm: true
        }
      )
      
      if (updateError2) {
        console.error('❌ Erro ao atualizar KonnectArt:', updateError2.message)
      } else {
        console.log('✅ Usuário KonnectArt atualizado com sucesso!')
        console.log('   - Email: konnectart@startcup-amf.com')
        console.log('   - Senha: KonnectArt@5193!')
      }
    }

    console.log('\n✅ Processo de atualização concluído!')
    console.log('\n📋 CREDENCIAIS FINAIS:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Equipe: Mistos')
    console.log('Email:  mistos@startcup-amf.com')
    console.log('Senha:  Mistos@2894!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Equipe: KonnectArt')
    console.log('Email:  konnectart@startcup-amf.com')
    console.log('Senha:  KonnectArt@5193!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n🎉 Agora as equipes podem fazer login com as novas credenciais!')

  } catch (error) {
    console.error('❌ Erro fatal:', error.message)
    process.exit(1)
  }
}

updateAuthUsers()
