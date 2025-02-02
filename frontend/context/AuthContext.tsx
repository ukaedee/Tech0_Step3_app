'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useTransition } from 'react'
import { parseCookies, setCookie, destroyCookie } from 'nookies'

interface AuthState {
  isAuthenticated: boolean
  token: string | null
}

interface AuthContextType extends AuthState {
  login: (token: string) => void
  logout: () => void
  isInitialized: boolean
  isServerSide: boolean
  isLoading: boolean
}

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  token: null,
}

// サーバーサイドレンダリング時のデフォルト値
const defaultContext: AuthContextType = {
  ...defaultAuthState,
  login: () => {},
  logout: () => {},
  isInitialized: true,
  isServerSide: typeof window === 'undefined',
  isLoading: false
}

const AuthContext = createContext<AuthContextType>(defaultContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isServerSide = typeof window === 'undefined'

  // トークンの検証ロジックを分離
  const validateToken = useCallback((token: string | null): boolean => {
    if (isServerSide) return false
    return Boolean(token && token.length > 0)
  }, [isServerSide])

  // 認証状態の更新を一元化
  const updateAuthState = useCallback((token: string | null) => {
    if (isServerSide) return
    startTransition(() => {
      const isValid = validateToken(token)
      setAuthState({
        isAuthenticated: isValid,
        token: isValid ? token : null
      })
    })
  }, [isServerSide, validateToken])

  useEffect(() => {
    if (isServerSide) {
      setIsInitialized(true)
      return
    }

    let mounted = true

    const initializeAuth = async () => {
      try {
        const cookies = parseCookies()
        const storedToken = cookies['auth-token']
        if (storedToken && validateToken(storedToken)) {
          console.log('Auth state restored from cookie')
          updateAuthState(storedToken)
        } else {
          console.log('No valid token found in cookie')
          updateAuthState(null)
        }
      } catch (error) {
        console.error('Error initializing auth state:', error)
        updateAuthState(null)
      } finally {
        if (mounted) {
          startTransition(() => {
            setIsInitialized(true)
          })
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [isServerSide, validateToken, updateAuthState])

  const login = useCallback((newToken: string) => {
    if (isServerSide) return

    try {
      if (!validateToken(newToken)) {
        throw new Error('Invalid token provided')
      }
      // Set cookie with appropriate options
      setCookie(null, 'auth-token', newToken, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      updateAuthState(newToken)
      console.log('Login successful')
    } catch (error) {
      console.error('Error during login:', error)
      destroyCookie(null, 'auth-token')
      updateAuthState(null)
    }
  }, [isServerSide, validateToken, updateAuthState])

  const logout = useCallback(() => {
    if (isServerSide) return

    try {
      destroyCookie(null, 'auth-token')
      updateAuthState(null)
      console.log('Logout successful')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }, [isServerSide, updateAuthState])

  const contextValue = {
    ...authState,
    login,
    logout,
    isInitialized,
    isServerSide,
    isLoading: isPending
  }

  // サーバーサイドレンダリング時は子コンポーネントをそのまま返す
  if (isServerSide) {
    return <>{children}</>
  }

  // クライアントサイドで初期化中の場合も子コンポーネントをそのまま返す
  if (!isInitialized) {
    return <>{children}</>
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
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

// サーバーサイドでの認証状態の取得
export async function getServerSideAuth(ctx?: any) {
  const cookies = parseCookies(ctx)
  const token = cookies['auth-token']
  
  return {
    isAuthenticated: Boolean(token),
    token: token || null
  }
}