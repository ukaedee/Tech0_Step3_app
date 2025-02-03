'use client'

import { type ReactNode, createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface AuthState {
  isAuthenticated: boolean
  token: string | null
}

interface AuthContextType extends AuthState {
  login: (token: string) => void
  logout: () => void
  isInitialized: boolean
  isLoading: boolean
}

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  token: null,
}

const defaultContext: AuthContextType = {
  ...defaultAuthState,
  login: () => {},
  logout: () => {},
  isInitialized: false,
  isLoading: true
}

const AuthContext = createContext<AuthContextType>(defaultContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const validateToken = useCallback((token: string | null): boolean => {
    return Boolean(token && token.length > 0)
  }, [])

  const updateAuthState = useCallback((token: string | null) => {
    const isValid = validateToken(token)
    setAuthState({
      isAuthenticated: isValid,
      token: isValid ? token : null
    })
  }, [validateToken])

  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window === 'undefined') return // SSR 環境では処理をスキップ

      setIsLoading(true)

      try {
        const storedToken = localStorage.getItem('access_token')
        console.log('Stored token:', storedToken) // デバッグ用

        if (storedToken && validateToken(storedToken)) {
          console.log('Auth state restored from localStorage')
          updateAuthState(storedToken)
        } else {
          console.log('No valid token found in localStorage')
          // トークンがない場合はCookieも削除
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          updateAuthState(null)
          if (window.location.pathname !== '/login') {
            router.push('/login')
          }
        }
      } catch (error) {
        console.error('Error initializing auth state:', error)
        updateAuthState(null)
      } finally {
        setIsInitialized(true)
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [validateToken, updateAuthState, router])

  const login = useCallback((newToken: string) => {
    setIsLoading(true)
    try {
      if (!validateToken(newToken)) {
        throw new Error('Invalid token provided')
      }
      localStorage.setItem('access_token', newToken)
      updateAuthState(newToken)
      console.log('Login successful')
    } catch (error) {
      console.error('Error during login:', error)
      localStorage.removeItem('access_token')
      updateAuthState(null)
    }
    setIsLoading(false)
  }, [validateToken, updateAuthState])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      localStorage.removeItem('access_token')
      // Cookieも削除
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      updateAuthState(null)
      console.log('Logout successful')
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      setIsLoading(false)
    }
  }, [updateAuthState])

  const contextValue = {
    ...authState,
    login,
    logout,
    isInitialized,
    isLoading
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
