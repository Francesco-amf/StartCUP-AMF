'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface HeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  showLogout?: boolean
}

export default function Header({ title, subtitle, backHref, showLogout = true }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    const confirm = window.confirm('Tem certeza que deseja sair?')
    if (!confirm) return

    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {backHref && (
              <Link href={backHref}>
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  ← Voltar
                </Button>
              </Link>
            )}
          </div>
          {showLogout && (
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={handleLogout}
            >
              🚪 Sair
            </Button>
          )}
        </div>
        <h1 className="text-4xl font-bold">{title}</h1>
        {subtitle && <p className="text-purple-100 mt-2">{subtitle}</p>}
      </div>
    </div>
  )
}
