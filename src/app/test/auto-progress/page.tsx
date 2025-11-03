'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProgressState {
  currentPhase: number;
  currentQuest: number;
  totalPhases: number;
  status: 'idle' | 'running' | 'stopped' | 'completed' | 'error';
  lastAction: string;
  timeRemaining?: number;
}

export default function TestProgressPage() {
  const [state, setState] = useState<ProgressState | null>(null);
  const [speed, setSpeed] = useState<'fast' | 'turbo' | 'real'>('fast');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(async () => {
        const response = await fetch('/api/test/auto-progress?action=status');
        const data = await response.json();
        setState(data);

        // Parar auto-refresh se completou ou parou
        if (data.status === 'completed' || data.status === 'stopped' || data.status === 'error') {
          setAutoRefresh(false);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleStart = async () => {
    const response = await fetch(`/api/test/auto-progress?action=start&speed=${speed}`);
    const data = await response.json();
    
    if (data.success) {
      setAutoRefresh(true);
      setState(data.state);
    }
  };

  const handleStop = async () => {
    const response = await fetch('/api/test/auto-progress?action=stop');
    const data = await response.json();
    setState(data.state);
    setAutoRefresh(false);
  };

  const handleCheckStatus = async () => {
    const response = await fetch('/api/test/auto-progress?action=status');
    const data = await response.json();
    setState(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'stopped':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running':
        return '🚀 Rodando';
      case 'completed':
        return '✅ Completo';
      case 'stopped':
        return '⏸️ Parado';
      case 'error':
        return '❌ Erro';
      default:
        return '⏳ Aguardando';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2 border-indigo-500/30 bg-black/40 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              🧪 Teste de Progressão Automática
            </CardTitle>
            <CardDescription className="text-gray-400">
              Simula o evento completo em velocidade acelerada para testar todas as funcionalidades
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Controles */}
        <Card className="border-2 border-indigo-500/30 bg-black/40 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-white">Controles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seleção de Velocidade */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Velocidade:</label>
              <div className="flex gap-2">
                <Button
                  variant={speed === 'fast' ? 'default' : 'outline'}
                  onClick={() => setSpeed('fast')}
                  disabled={state?.status === 'running'}
                >
                  🏃 Fast (30s/quest)
                </Button>
                <Button
                  variant={speed === 'turbo' ? 'default' : 'outline'}
                  onClick={() => setSpeed('turbo')}
                  disabled={state?.status === 'running'}
                >
                  ⚡ Turbo (10s/quest)
                </Button>
                <Button
                  variant={speed === 'real' ? 'default' : 'outline'}
                  onClick={() => setSpeed('real')}
                  disabled={state?.status === 'running'}
                >
                  🐌 Real (tempo real)
                </Button>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Button
                onClick={handleStart}
                disabled={state?.status === 'running'}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                ▶️ Iniciar Progressão
              </Button>
              <Button
                onClick={handleStop}
                disabled={state?.status !== 'running'}
                variant="destructive"
              >
                ⏸️ Parar
              </Button>
              <Button onClick={handleCheckStatus} variant="outline">
                🔄 Atualizar Status
              </Button>
            </div>

            {/* Links Rápidos */}
            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Abrir para visualizar mudanças:</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/live-dashboard', '_blank')}
                >
                  📊 Live Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/submit', '_blank')}
                >
                  📝 Página de Submissão
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/control-panel', '_blank')}
                >
                  🎛️ Painel de Controle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado Atual */}
        {state && (
          <Card className="border-2 border-indigo-500/30 bg-black/40 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white">Estado Atual</CardTitle>
                <Badge className={getStatusColor(state.status)}>
                  {getStatusLabel(state.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progresso */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">Fase Atual:</p>
                  <p className="text-2xl font-bold text-white">
                    {state.currentPhase} / {state.totalPhases}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">Quest Atual:</p>
                  <p className="text-2xl font-bold text-white">
                    {state.currentQuest} / 4
                  </p>
                </div>
              </div>

              {/* Barra de Progresso da Fase */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Progresso da Fase</span>
                  <span>{Math.round((state.currentQuest / 4) * 100)}%</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${(state.currentQuest / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Barra de Progresso Total */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Progresso Total</span>
                  <span>
                    {Math.round(((state.currentPhase - 1) / state.totalPhases) * 100 + 
                    (state.currentQuest / 4) * (100 / state.totalPhases))}%
                  </span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                    style={{
                      width: `${
                        ((state.currentPhase - 1) / state.totalPhases) * 100 +
                        (state.currentQuest / 4) * (100 / state.totalPhases)
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Última Ação */}
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Última Ação:</p>
                <p className="text-lg text-white font-mono">{state.lastAction}</p>
              </div>

              {/* Tempo Restante */}
              {state.timeRemaining !== undefined && state.status === 'running' && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">Tempo restante da quest:</p>
                  <p className="text-3xl font-bold text-yellow-400 font-mono">
                    {state.timeRemaining}s
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        <Card className="border-2 border-indigo-500/30 bg-black/40 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-white">📖 Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-gray-300">
            <ol className="list-decimal list-inside space-y-2">
              <li>Escolha a velocidade (recomendado: Fast para testes rápidos)</li>
              <li>Clique em "Iniciar Progressão"</li>
              <li>Abra as páginas (Live Dashboard, Submissão) em outras abas</li>
              <li>Observe as quests e fases mudando automaticamente</li>
              <li>O sistema vai percorrer: Quest 1 → 2 → 3 → BOSS 🔥 para cada fase</li>
              <li>Após cada fase, avança automaticamente para a próxima</li>
            </ol>
            <div className="pt-4 border-t border-gray-700 mt-4">
              <p className="text-sm text-yellow-400">
                💡 Dica: Deixe esta página aberta para ver o progresso em tempo real!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
