'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'

interface CoinTransaction {
  id: string
  amount: number
  reason: string
  created_at: string
  reference_id?: string
}

interface SubmissionDetails {
  quest_id: string
  quest_name?: string
  final_points: number
  status: string
  created_at: string
}

interface PenaltyDetails {
  penalty_type: string
  points_deduction: number
  reason?: string
  created_at: string
}

interface Props {
  teamId: string
  currentTotalCoins: number
}

export default function AMFCoinsHistory({ teamId, currentTotalCoins }: Props) {
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])
  const [submissions, setSubmissions] = useState<SubmissionDetails[]>([])
  const [penalties, setPenalties] = useState<PenaltyDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (!showHistory) return

    const fetchHistory = async () => {
      setLoading(true)

      // Buscar ajustes de coins (mentoria, bônus, etc.)
      const { data: adjustments } = await supabase
        .from('coin_adjustments')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      // Buscar submissions avaliadas
      const { data: subs } = await supabase
        .from('submissions')
        .select(`
          id,
          quest_id,
          final_points,
          status,
          created_at,
          quests (
            name
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'evaluated')
        .order('created_at', { ascending: false })

      // Buscar penalidades
      const { data: pens } = await supabase
        .from('penalties')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      setTransactions(adjustments || [])
      setSubmissions(
        (subs || []).map((s: any) => ({
          quest_id: s.quest_id,
          quest_name: s.quests?.name,
          final_points: s.final_points || 0,
          status: s.status,
          created_at: s.created_at,
        }))
      )
      setPenalties(pens || [])
      setLoading(false)
    }

    fetchHistory()
  }, [showHistory, teamId, supabase])

  // Combinar todas as transações em uma timeline única
  const getAllTransactions = () => {
    const combined: Array<{
      type: 'adjustment' | 'submission' | 'penalty'
      date: string
      amount: number
      description: string
      icon: string
      color: string
    }> = []

    // Ajustes de coins (mentor, bônus, etc.)
    transactions.forEach((t) => {
      let description = ''
      let icon = ''

      if (t.reason === 'mentor_request') {
        description = `🆘 Chamada de Mentor`
        icon = '🆘'
      } else if (t.reason === 'bonus') {
        description = `🎁 Bônus`
        icon = '🎁'
      } else if (t.reason === 'penalty_refund') {
        description = `↩️ Devolução de Penalidade`
        icon = '↩️'
      } else {
        description = t.reason
        icon = t.amount > 0 ? '➕' : '➖'
      }

      combined.push({
        type: 'adjustment',
        date: t.created_at,
        amount: t.amount,
        description,
        icon,
        color: t.amount > 0 ? 'green' : 'red',
      })
    })

    // Submissions avaliadas (ganho de coins)
    submissions.forEach((s) => {
      combined.push({
        type: 'submission',
        date: s.created_at,
        amount: s.final_points,
        description: `✅ Quest avaliada: ${s.quest_name || 'Quest'}`,
        icon: '✅',
        color: 'green',
      })
    })

    // Penalidades (perda de coins)
    penalties.forEach((p) => {
      let penaltyName = ''
      switch (p.penalty_type) {
        case 'plagiarism':
          penaltyName = 'Plágio'
          break
        case 'late_submission':
          penaltyName = 'Entrega Atrasada'
          break
        case 'inappropriate_behavior':
          penaltyName = 'Comportamento Inadequado'
          break
        case 'rule_violation':
          penaltyName = 'Violação de Regras'
          break
        default:
          penaltyName = p.penalty_type
      }

      combined.push({
        type: 'penalty',
        date: p.created_at,
        amount: -p.points_deduction,
        description: `⚠️ Penalidade: ${penaltyName}${p.reason ? ` - ${p.reason}` : ''}`,
        icon: '⚠️',
        color: 'red',
      })
    })

    // Ordenar por data (mais recente primeiro)
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return combined
  }

  const allTransactions = getAllTransactions()

  // Calcular saldo progressivo (do mais antigo para o mais recente)
  const calculateRunningBalance = () => {
    const reversed = [...allTransactions].reverse()
    let runningBalance = 0

    return reversed.map((transaction) => {
      runningBalance += transaction.amount
      return {
        ...transaction,
        balance: runningBalance,
      }
    }).reverse()
  }

  const transactionsWithBalance = calculateRunningBalance()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className="p-3 md:p-4 lg:p-6 bg-gradient-to-br from-[#0A1E47] to-[#001A4D] border-2 border-[#FFD700]/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-[#FFD700] flex items-center gap-2">
            🪙 Histórico de AMF Coins
          </h3>
          <p className="text-sm text-[#FFD700]/70 mt-1">
            Ganhos, perdas e saldo atual
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#FFD700]/60">Saldo Atual</p>
          <p className="text-2xl md:text-3xl font-bold text-[#FFD700]">
            {currentTotalCoins}
          </p>
        </div>
      </div>

      <button
        onClick={() => setShowHistory(!showHistory)}
        className="w-full bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border-2 border-[#FFD700]/40 text-[#FFD700] font-semibold py-3 rounded-lg transition-all mb-4"
      >
        {showHistory ? '📊 Ocultar Histórico' : '📜 Ver Histórico Detalhado'}
      </button>

      {showHistory && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-[#FFD700]/60">
              ⏳ Carregando histórico...
            </div>
          ) : transactionsWithBalance.length === 0 ? (
            <div className="text-center py-8 text-[#FFD700]/60">
              📭 Nenhuma transação ainda
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactionsWithBalance.map((transaction, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    transaction.color === 'green'
                      ? 'bg-green-500/10 border-green-500'
                      : 'bg-red-500/10 border-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{transaction.icon}</span>
                        <p className="text-sm font-medium text-white">
                          {transaction.description}
                        </p>
                      </div>
                      <p className="text-xs text-white/50">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount}
                      </p>
                      <p className="text-xs text-white/50">
                        Saldo: {transaction.balance}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resumo estatístico */}
          {!loading && transactionsWithBalance.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#FFD700]/20">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/30">
                  <p className="text-xs text-green-400/70">Total Ganho</p>
                  <p className="text-xl font-bold text-green-400">
                    +
                    {allTransactions
                      .filter((t) => t.amount > 0)
                      .reduce((sum, t) => sum + t.amount, 0)}
                  </p>
                </div>
                <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/30">
                  <p className="text-xs text-red-400/70">Total Perdido</p>
                  <p className="text-xl font-bold text-red-400">
                    {allTransactions
                      .filter((t) => t.amount < 0)
                      .reduce((sum, t) => sum + t.amount, 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
