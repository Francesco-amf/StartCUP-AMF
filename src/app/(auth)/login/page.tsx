'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Verificar role do usuário
    const userRole = data.user?.user_metadata?.role

    if (userRole === 'team') {
      router.push('/dashboard')
    } else if (userRole === 'evaluator') {
      router.push('/evaluate')
    } else if (userRole === 'admin') {
      router.push('/control-panel')
    } else {
      setError('Role não definido para este usuário')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-startcup p-4">
      {/* Logo do Evento */}
      <div className="mb-12 animate-fade-in">
        <img
          src="/startcup-logo.jpg"
          alt="StartCup AMF"
          className="h-48 w-auto object-contain drop-shadow-2xl"
        />
      </div>

      <Card className="w-full max-w-md p-8 bg-gradient-to-br from-[#0A1E47] to-[#001A4D] border-2 border-[#00E5FF]/30 backdrop-blur-sm shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold gradient-text-startcup mb-2">
            🚀 StartCup AMF
          </h2>
          <p className="text-[#00E5FF]/70">Acelerador de Startups - Bem-vindo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-[#00E5FF] mb-2 block">
              Email
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="input-startcup bg-white/5 border-[#00E5FF]/30 text-white placeholder:text-white/40"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#00E5FF] mb-2 block">
              Senha
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="input-startcup bg-white/5 border-[#00E5FF]/30 text-white placeholder:text-white/40"
            />
          </div>

          {error && (
            <div className="bg-[#FF3D00]/20 border border-[#FF3D00]/50 text-[#FF6B47] px-4 py-3 rounded-lg text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full btn-startcup-accent text-base py-6 font-semibold rounded-lg"
          >
            {loading ? '⏳ Entrando...' : '→ Entrar'}
          </Button>
        </form>
      </Card>

      {/* Decoração de fundo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-[#00E5FF]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#0047AB]/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}
