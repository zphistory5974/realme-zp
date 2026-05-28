'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href).finally(() => {
      const next = sessionStorage.getItem('zp_login_next') || '/'
      sessionStorage.removeItem('zp_login_next')
      router.replace(next)
    })
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-sm text-gray-500">로그인 중...</p>
    </div>
  )
}
