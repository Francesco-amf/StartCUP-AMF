import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import ResetSystemButton from '@/components/ResetSystemButton'
import PhaseController from '@/components/PhaseController'
import QuickActions from '@/components/QuickActions'

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
  const { data: eventConfig } = await supabase
    .from('event_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold">
            Painel de Controle Admin
          </h1>
          <p className="text-purple-100 mt-2">
            Gerenciamento do StartCup AMF
          </p>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Status do Evento */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-purple-900">🎮 Status do Evento</h2>
              <p className="text-purple-700">
                {eventConfig?.event_started
                  ? (eventConfig?.event_ended ? '🏁 Evento Encerrado' : '🔥 Evento em Andamento')
                  : '⏸️ Aguardando Início'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-600 font-semibold">Fase Atual:</p>
              <p className="text-3xl font-bold text-purple-900">
                {eventConfig?.current_phase === 0 ? 'Preparação' : `Fase ${eventConfig?.current_phase}`}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Estatísticas */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Equipes</h2>
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-4xl font-bold text-purple-600">
              {teams?.length || 0}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Avaliadores</h2>
              <span className="text-3xl">⭐</span>
            </div>
            <p className="text-4xl font-bold text-blue-600">
              {evaluators?.length || 0}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Submissões</h2>
              <span className="text-3xl">📄</span>
            </div>
            <p className="text-4xl font-bold text-green-600">
              {submissions?.length || 0}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Avaliações</h2>
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-4xl font-bold text-orange-600">
              {evaluations?.length || 0}
            </p>
          </Card>
        </div>

        {/* Controle de Fases */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>🎯</span>
            Controle de Fases do Evento
          </h2>
          <PhaseController
            currentPhase={eventConfig?.current_phase || 0}
            eventStarted={eventConfig?.event_started || false}
          />
        </Card>

        {/* Gerenciamento de Equipes */}
        <Card className="p-6 mt-6">
          <h2 className="text-2xl font-bold mb-4">Equipes Cadastradas</h2>
          {teams && teams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Nome</th>
                    <th className="text-left p-2">Curso</th>
                    <th className="text-left p-2">Membros</th>
                    <th className="text-left p-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{team.name}</td>
                      <td className="p-2">{team.course}</td>
                      <td className="p-2">{team.members}</td>
                      <td className="p-2 text-sm text-gray-600">{team.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">Nenhuma equipe cadastrada ainda.</p>
          )}
        </Card>

        {/* Gerenciamento de Avaliadores */}
        <Card className="p-6 mt-6">
          <h2 className="text-2xl font-bold mb-4">Avaliadores</h2>
          {evaluators && evaluators.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Nome</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Especialidade</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluators.map((evaluator) => (
                    <tr key={evaluator.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{evaluator.name}</td>
                      <td className="p-2 text-sm text-gray-600">{evaluator.email}</td>
                      <td className="p-2">{evaluator.specialty || 'Geral'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">Nenhum avaliador cadastrado ainda.</p>
          )}
        </Card>

        {/* Ações Rápidas */}
        <Card className="p-6 mt-6">
          <h2 className="text-2xl font-bold mb-4">Ações Rápidas</h2>
          <QuickActions />
        </Card>

        {/* Zona de Perigo */}
        <Card className="p-6 mt-6 border-red-300 bg-red-50">
          <h2 className="text-2xl font-bold mb-2 text-red-700">🚨 Zona de Perigo</h2>
          <p className="text-red-600 mb-4 text-sm">
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
