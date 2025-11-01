'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import OnlineStatusToggle from '@/components/OnlineStatusToggle'
import Link from 'next/link'

interface HeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  showLogout?: boolean
  logoUrl?: string
}

export default function Header({ title, subtitle, backHref, showLogout = true, logoUrl }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [userRole, setUserRole] = useState<string | null>(null)

  // Buscar role do usuário autenticado
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserRole(user?.user_metadata?.role || null)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    const confirm = window.confirm('Tem certeza que deseja sair?')
    if (!confirm) return

    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="bg-gradient-to-r from-[#0A1E47] via-[#001A4D] to-[#0047AB] border-b-2 border-[#00E5FF]/30 text-white p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            {backHref && (
              <Link href={backHref}>
                <Button variant="ghost" className="text-[#00E5FF] hover:bg-[#00E5FF]/10 hover:text-white">
                  ← Voltar
                </Button>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            {userRole === 'evaluator' && <OnlineStatusToggle />}
            {showLogout && (
              <Button
                variant="ghost"
                className="text-[#00E5FF] hover:bg-[#00E5FF]/10 hover:text-white"
                onClick={handleLogout}
              >
                🚪 Sair
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4 flex-1">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Team logo"
                className="h-36 w-36 object-contain bg-[#0A1E47]/20 p-2 rounded-lg shadow-lg border border-[#00E5FF]/30"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold gradient-text-startcup">{title}</h1>
              {subtitle && <p className="text-[#00E5FF] mt-2">{subtitle}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
