import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import ResetSystemButton from '@/components/ResetSystemButton'
import PhaseController from '@/components/PhaseController'
import QuickActions from '@/components/QuickActions'
import PenaltyAssigner from '@/components/admin/PenaltyAssigner'
import Header from '@/components/Header'

export default async function AdminControlPanel() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verificar se é admin
  const userRole = user.user_metadata?.role
  if (userRole !== 'admin') {
    redirect('/login')
  }

  // Buscar configuração do evento
  const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'
  const { data: eventConfig } = await supabase
    .from('event_config')
    .select('*')
    .eq('id', eventConfigId)
    .single()

  // Buscar estatísticas gerais
  const { data: teams } = await supabase
    .from('teams')
    .select('*')

  const { data: evaluators } = await supabase
    .from('evaluators')
    .select('*')

  // Buscar estatísticas do evento
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')

  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('*')

  return (
    <div className="min-h-screen gradient-startcup">
      <Header
        title="Painel de Controle Admin"
        subtitle="Gerenciamento do StartCup AMF"
        backHref="/"
        showLogout={true}
      />

      <div className="container mx-auto p-6">
        {/* Status do Evento */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-[#0A1E47] to-[#001A4D] border-2 border-[#00E5FF]/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#00E5FF]">🎮 Status do Evento</h2>
              <p className="text-[#00E5FF]/80">
                {eventConfig?.event_started
                  ? (eventConfig?.event_ended ? '🏁 Evento Encerrado' : '🔥 Evento em Andamento')
                  : '⏸️ Aguardando Início'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#00E5FF] font-semibold">Quests Ativas:</p>
              <p className="text-3xl font-bold text-[#00E5FF]">
                {eventConfig?.event_started ? '🟢 Sim' : '🔴 Não'}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Estatísticas */}
          <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-l-4 border-[#00E5FF]/60">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Equipes</h2>
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-4xl font-bold text-[#00E5FF]">
              {teams?.length || 0}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-l-4 border-[#00E5FF]/60">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Avaliadores</h2>
              <span className="text-3xl">⭐</span>
            </div>
            <p className="text-4xl font-bold text-[#00E5FF]">
              {evaluators?.length || 0}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-l-4 border-[#00FF88]/60">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Submissões</h2>
              <span className="text-3xl">📄</span>
            </div>
            <p className="text-4xl font-bold text-[#00FF88]">
              {submissions?.length || 0}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-l-4 border-[#FF9800]/60">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Avaliações</h2>
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-4xl font-bold text-[#FF9800]">
              {evaluations?.length || 0}
            </p>
          </Card>
        </div>

        {/* Controle de Fases */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/30">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[#00E5FF]">
            <span>🎯</span>
            Controle de Fases do Evento
          </h2>
          <PhaseController
            currentPhase={eventConfig?.current_phase || 0}
            eventStarted={eventConfig?.event_started || false}
          />
        </Card>

        {/* Gerenciamento de Equipes */}
        <Card className="p-6 mt-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00D4FF]/30">
          <h2 className="text-2xl font-bold mb-4 text-[#00D4FF]">👥 Equipes Cadastradas</h2>
          {teams && teams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#00D4FF]/20">
                    <th className="text-left p-2 text-[#00D4FF]">Nome</th>
                    <th className="text-left p-2 text-[#00D4FF]">Curso</th>
                    <th className="text-left p-2 text-[#00D4FF]">Membros</th>
                    <th className="text-left p-2 text-[#00D4FF]">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id} className="border-b border-[#00D4FF]/10 hover:bg-[#0A1E47]/40">
                      <td className="p-2 font-medium text-white">{team.name}</td>
                      <td className="p-2 text-[#00E5FF]">{team.course}</td>
                      <td className="p-2 text-[#00E5FF]">{team.members}</td>
                      <td className="p-2 text-sm text-[#00E5FF]/70">{team.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[#00E5FF]/60">Nenhuma equipe cadastrada ainda.</p>
          )}
        </Card>

        {/* Gerenciamento de Avaliadores */}
        <Card className="p-6 mt-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FF9800]/30">
          <h2 className="text-2xl font-bold mb-4 text-[#FF9800]">⭐ Avaliadores</h2>
          {evaluators && evaluators.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#FF9800]/20">
                    <th className="text-left p-2 text-[#FF9800]">Nome</th>
                    <th className="text-left p-2 text-[#FF9800]">Email</th>
                    <th className="text-left p-2 text-[#FF9800]">Especialidade</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluators.map((evaluator) => (
                    <tr key={evaluator.id} className="border-b border-[#FF9800]/10 hover:bg-[#0A1E47]/40">
                      <td className="p-2 font-medium text-white">{evaluator.name}</td>
                      <td className="p-2 text-sm text-[#00E5FF]/70">{evaluator.email}</td>
                      <td className="p-2 text-[#00E5FF]">{evaluator.specialty || 'Geral'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[#00E5FF]/60">Nenhum avaliador cadastrado ainda.</p>
          )}
        </Card>

        {/* Ações Rápidas */}
        <Card className="p-6 mt-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/30">
          <h2 className="text-2xl font-bold mb-4 text-[#00E5FF]">⚡ Ações Rápidas</h2>
          <QuickActions />
        </Card>

        {/* Atribuição de Penalidades */}
        <Card className="p-6 mt-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FF3D00]/40">
          <PenaltyAssigner />
        </Card>

        {/* Zona de Perigo */}
        <Card className="p-6 mt-6 border-2 border-[#FF3333]/40 bg-gradient-to-br from-[#4A0A0A]/40 to-[#1A0000]/40">
          <h2 className="text-2xl font-bold mb-2 text-[#FF6B6B]">🚨 Zona de Perigo</h2>
          <p className="text-[#FF9999] mb-4 text-sm">
            Estas ações são irreversíveis. Use com extrema cautela.
          </p>
          <div className="flex flex-wrap gap-4">
            <ResetSystemButton />
          </div>
        </Card>
      </div>
    </div>
  )
}

