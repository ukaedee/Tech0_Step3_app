'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Dashboard from '@/components/Dashboard'
import { useAuth } from '@/context/AuthContext'

function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, token, isInitialized, isServerSide } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (isServerSide) {
      setIsChecking(false)
      return
    }

    let mounted = true

    const checkAuth = async () => {
      try {
        if (!isInitialized) {
          return
        }

        if (!isAuthenticated || !token) {
          console.log('AuthCheck: Redirecting to login')
          await router.replace('/login')
        }
      } catch (error) {
        console.error('AuthCheck: Error:', error)
        await router.replace('/login')
      } finally {
        if (mounted) {
          setIsChecking(false)
        }
      }
    }

    checkAuth()

    return () => {
      mounted = false
    }
  }, [isAuthenticated, token, isInitialized, isServerSide, router])

  if (isServerSide || !isInitialized || isChecking) {
    return <>{children}</>
  }

  return isAuthenticated ? <>{children}</> : null
}

export default function HomePage() {
  const { isInitialized, isServerSide } = useAuth()

  if (isServerSide || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <AuthCheck>
      <Dashboard />
    </AuthCheck>
  )
} 