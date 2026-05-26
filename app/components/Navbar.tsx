'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  username: string
  isAdmin: boolean
}

export default function Navbar({ username, isAdmin }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/dashboard', label: 'Rankings' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/trips', label: 'Trips' },
    { href: '/share', label: '📋 Post' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
            🔒 <span>Escape Rater</span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">{username}</span>
          <button
            onClick={signOut}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
