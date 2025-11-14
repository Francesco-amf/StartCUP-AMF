'use client'

import { useEffect, useState } from 'react'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function SoundTester() {
  const [isClient, setIsClient] = useState(false)
  const { play } = useSoundSystem()

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  const basicSounds = [
    { id: 'quest-complete', name: '✓ Quest Completa', emoji: '🎯' },
    { id: 'quest-start', name: '▶ Quest Inicia', emoji: '🚀' },
    { id: 'phase-start', name: '▶ Fase Inicia', emoji: '🌟' },
    { id: 'penalty', name: '⚠ Penalidade', emoji: '⛔' },
    { id: 'ranking-up', name: '📈 Sobe Ranking', emoji: '⬆️' },
    { id: 'ranking-down', name: '📉 Desce Ranking', emoji: '⬇️' }
  ]

  const advancedSounds = [
    { id: 'coins', name: '🪙 Moedas', emoji: '💰' },
    { id: 'submission', name: '📤 Submissão', emoji: '✅' },
    { id: 'event-start', name: '🎬 Evento Inicia', emoji: '🎊' },
    { id: 'boss-spawn', name: '👹 Boss Aparece', emoji: '⚔️' },
    { id: 'evaluator-online', name: '🟢 Avaliador Online', emoji: '📡' },
    { id: 'evaluator-offline', name: '🔴 Avaliador Offline', emoji: '📴' }
  ]

  const handlePlay = (soundId: string) => {
    play(soundId as any)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 p-4 md:p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">🎵 Testador de Sons</h1>
        <p className="text-purple-200 mb-8">Clique em qualquer botão para ouvir o som</p>

        {/* Sons Básicos */}
        <Card className="bg-white/10 border-white/20 backdrop-blur p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Sons Básicos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {basicSounds.map((sound) => (
              <Button
                key={sound.id}
                onClick={() => handlePlay(sound.id)}
                className="bg-purple-600 hover:bg-purple-700 text-white h-auto py-3 px-4 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">{sound.emoji}</span>
                <span className="text-sm font-semibold">{sound.name}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Sons Avançados */}
        <Card className="bg-white/10 border-white/20 backdrop-blur p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Sons Impactantes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {advancedSounds.map((sound) => (
              <Button
                key={sound.id}
                onClick={() => handlePlay(sound.id)}
                className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white h-auto py-3 px-4 flex flex-col items-center gap-2"
              >
                <span className="text-xl">{sound.emoji}</span>
                <span className="text-xs font-semibold text-center">{sound.name}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Descrições */}
        <Card className="bg-white/10 border-white/20 backdrop-blur p-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">📚 Descrição dos Sons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white text-sm">
            <div>
              <h3 className="font-bold text-purple-300 mb-2">🔊 Buzina (Horn)</h3>
              <p className="text-purple-100">Triplicação de buzz alto e penetrante. Ideal para alertas críticos que precisam de atenção imediata.</p>
            </div>
            <div>
              <h3 className="font-bold text-pink-300 mb-2">🎭 Fanfarra (Fanfare)</h3>
              <p className="text-pink-100">Som épico com acorde inicial e melodia ascendente. Perfeito para anúncios importantes e momentos especiais.</p>
            </div>
            <div>
              <h3 className="font-bold text-red-300 mb-2">💥 Explosão (Explosion)</h3>
              <p className="text-red-100">Série de buzz descendentes. Ótimo para ações impactantes como derrota de inimigos ou destruição.</p>
            </div>
            <div>
              <h3 className="font-bold text-yellow-300 mb-2">🔔 Ding (Ding)</h3>
              <p className="text-yellow-100">Acorde de sino decrescente. Suave e agradável, como um elevador chegando.</p>
            </div>
            <div>
              <h3 className="font-bold text-orange-300 mb-2">⚠ Erro Beep (Error Beep)</h3>
              <p className="text-orange-100">Dois bips em frequências diferentes. O som clássico de erro do Windows.</p>
            </div>
            <div>
              <h3 className="font-bold text-green-300 mb-2">⚡ Laser (Laser)</h3>
              <p className="text-green-100">Som descendente com filtro. Efeito futurista tipo Star Wars.</p>
            </div>
            <div>
              <h3 className="font-bold text-blue-300 mb-2">🎮 Power-up Gamer (Power-up Gamified)</h3>
              <p className="text-blue-100">Escala rápida com som quadrado. Estilo Sonic the Hedgehog.</p>
            </div>
            <div>
              <h3 className="font-bold text-cyan-300 mb-2">🏆 Vitória (Victory)</h3>
              <p className="text-cyan-100">Escala ascendente longa. O som de vitória clássico de Super Mario.</p>
            </div>
          </div>
        </Card>

        {/* Casos de Uso Sugeridos */}
        <Card className="bg-white/10 border-white/20 backdrop-blur p-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">💡 Sugestões de Uso</h2>
          <div className="space-y-3 text-white text-sm">
            <div className="bg-purple-500/20 p-3 rounded border-l-4 border-purple-500">
              <p className="font-bold">🚀 Boss Battle</p>
              <p className="text-purple-100">Quando uma equipe enfrenta o chefe da fase</p>
            </div>
            <div className="bg-pink-500/20 p-3 rounded border-l-4 border-pink-500">
              <p className="font-bold">🏆 Fanfare + Victory</p>
              <p className="text-pink-100">Quando evento termina ou equipe vence</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded border-l-4 border-red-500">
              <p className="font-bold">💥 Explosion</p>
              <p className="text-red-100">Quando algo é destruído ou falha crítica</p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded border-l-4 border-yellow-500">
              <p className="font-bold">⏱ Countdown</p>
              <p className="text-yellow-100">Aviso de tempo acabando (últimos 10 segundos)</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded border-l-4 border-green-500">
              <p className="font-bold">📈 Ascending</p>
              <p className="text-green-100">Progresso steadily ou sequência de sucessos</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
