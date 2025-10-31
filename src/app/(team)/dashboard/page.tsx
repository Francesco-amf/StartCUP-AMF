import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Header from '@/components/Header'

export default async function TeamDashboard() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  // Buscar informações da equipe
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('email', user.email)
    .single()

  // Buscar configuração do evento
  const { data: eventConfig } = await supabase
    .from('event_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  const phaseNames = [
    { name: 'Preparação', icon: '⏸️', color: 'gray' },
    { name: 'Fase 1: Descoberta', icon: '🔍', color: 'blue' },
    { name: 'Fase 2: Criação', icon: '💡', color: 'purple' },
    { name: 'Fase 3: Estratégia', icon: '📊', color: 'green' },
    { name: 'Fase 4: Refinamento', icon: '✨', color: 'yellow' },
    { name: 'Fase 5: Pitch Final', icon: '🎯', color: 'red' },
  ]

  const currentPhase = phaseNames[eventConfig?.current_phase || 0]

  // Buscar submissions da equipe
  const { data: submissions } = await supabase
    .from('submissions')
    .select('quest_id, status, final_points')
    .eq('team_id', team?.id)

  console.log('📦 Team submissions for dashboard:', submissions)

  // Calcular pontuação total
  const totalPoints = submissions?.reduce((sum, s) => sum + (s.final_points || 0), 0) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={`Bem-vindo, ${team?.name || 'Equipe'}! 👋`}
        subtitle={team?.course}
        showLogout={true}
      />

      <div className="container mx-auto p-6">
        <div className="grid gap-6">
          {/* Fase Atual do Evento */}
          <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-semibold mb-1">🎮 FASE ATUAL DO EVENTO</p>
                <h2 className="text-2xl font-bold text-purple-900">
                  {currentPhase.icon} {currentPhase.name}
                </h2>
              </div>
              <div className="text-right">
                {eventConfig?.event_started && !eventConfig?.event_ended && (
                  <span className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                    🔥 EM ANDAMENTO
                  </span>
                )}
                {!eventConfig?.event_started && (
                  <span className="bg-gray-400 text-white px-4 py-2 rounded-full font-bold text-sm">
                    ⏸️ AGUARDANDO
                  </span>
                )}
                {eventConfig?.event_ended && (
                  <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                    🏁 ENCERRADO
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Estatísticas */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Pontuação Total</h3>
                <span className="text-2xl">🏆</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {totalPoints}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Entregas</h3>
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {submissions?.length || 0}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Avaliadas</h3>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {submissions?.filter(s => s.status === 'evaluated').length || 0}
              </p>
            </Card>
          </div>

          {/* Fase Atual */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">🎯 Fase Atual</h2>
            {eventConfig?.current_phase_id ? (
              <div>
                <p className="text-xl font-bold text-purple-600 mb-2">
                  {eventConfig.phases?.name}
                </p>
                <p className="text-gray-600">
                  Duração: {eventConfig.phases?.duration_minutes} minutos
                </p>
                <p className="text-gray-600">
                  Pontuação máxima: {eventConfig.phases?.max_points} pontos
                </p>
              </div>
            ) : (
              <p className="text-gray-600">
                O evento ainda não começou. Aguarde o início!
              </p>
            )}
          </Card>

          {/* Minhas Submissões */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">📋 Minhas Entregas</h2>
            {submissions && submissions.length > 0 ? (
              <div className="space-y-3">
                {submissions.map((submission, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Quest {index + 1}</p>
                      <p className="text-sm text-gray-600">
                        Status: {submission.status === 'pending' ? '⏳ Pendente' : '✅ Avaliada'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-purple-600">
                        {submission.final_points || 0} pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                Nenhuma entrega ainda. Clique abaixo para submeter!
              </p>
            )}
          </Card>

          {/* Ações Rápidas */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">⚡ Ações Rápidas</h2>
            <div className="space-y-3">
              <Link href="/submit">
                <Button className="w-full" size="lg">
                  📝 Submeter Entregas
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}