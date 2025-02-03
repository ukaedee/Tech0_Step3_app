'use client'

import { type ReactNode, createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface AuthState {
  isAuthenticated: boolean
  token: string | null
}

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<boolean>
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
  login: async () => false,
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
  
  // 前回の認証状態を保持するref
  const prevAuthStateRef = useRef<AuthState>(defaultAuthState)

  const validateToken = useCallback((token: string | null): boolean => {
    if (!token) {
      console.log('[Auth] Token validation: トークンが存在しません');
      return false;
    }

    try {
      // トークンの形式チェック（JWTの基本的な形式チェック）
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('[Auth] Token validation: 無効なトークン形式');
        return false;
      }

      // ペイロードのデコードと有効期限チェック
      const payload = JSON.parse(atob(parts[1]));
      const expirationTime = payload.exp * 1000; // UNIXタイムスタンプをミリ秒に変換
      const currentTime = Date.now();

      const isValid = currentTime < expirationTime;
      console.log('[Auth] Token validation:', {
        token: '存在します',
        isValid,
        expiresIn: Math.floor((expirationTime - currentTime) / 1000), // 残り秒数
      });

      return isValid;
    } catch (error) {
      console.error('[Auth] Token validation error:', error);
      return false;
    }
  }, []);

  const updateAuthState = useCallback((token: string | null) => {
    const isValid = validateToken(token)
    console.log('[Auth] 認証状態を更新:', {
      isValid,
      hasToken: Boolean(token),
      previousState: {
        isAuthenticated: prevAuthStateRef.current.isAuthenticated,
        hasToken: Boolean(prevAuthStateRef.current.token)
      }
    })

    // 状態を即座に更新
    setAuthState(prev => {
      const newState = {
        isAuthenticated: isValid,
        token: isValid ? token : null
      };
      prevAuthStateRef.current = newState;
      return newState;
    });

    // トークンの保存と状態の更新を同期的に行う
    if (isValid && token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
    
    console.log('[Auth] 認証状態更新完了:', { isAuthenticated: isValid, hasToken: Boolean(token) });
  }, [validateToken])

  // 認証状態の変更を監視
  useEffect(() => {
    console.log('[Auth] 認証状態変更検知:', { 
      isAuthenticated: authState.isAuthenticated,
      hasToken: Boolean(authState.token)
    });
  }, [authState]);

  // ローディング状態の変更を監視
  useEffect(() => {
    console.log('[Auth] ローディング状態変更:', {
      isLoading,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    });
  }, [isLoading]);

  // 初期化状態の変更を監視
  useEffect(() => {
    console.log('[Auth] 初期化状態変更:', {
      isInitialized,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    });

    // 認証状態とトークンの整合性チェック
    if (isInitialized && !isLoading && authState.isAuthenticated && !authState.token) {
      console.warn('[Auth] 警告: 認証状態とトークンの不整合を検出');
    }
  }, [isInitialized, isLoading, authState]);

  const clearAuthState = useCallback(() => {
    console.log('[Auth] 認証状態をクリア')
    const newState = { ...defaultAuthState }
    setAuthState(newState)
    prevAuthStateRef.current = newState
    localStorage.removeItem('access_token')
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }, [])

  // 初期化用のuseEffect
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      console.log('[Auth] 認証状態の初期化を開始');
      setIsLoading(true);

      try {
        // ローカルストレージからトークンを取得
        const storedToken = localStorage.getItem('access_token');
        console.log('[Auth] ストレージのトークンを確認:', { 
          hasToken: Boolean(storedToken),
          pathname: window.location.pathname 
        });

        if (storedToken) {
          // トークンの検証
          const isValid = validateToken(storedToken);
          console.log('[Auth] トークン検証結果:', { isValid });

          if (isValid && isMounted) {
            // 有効なトークンの場合、認証状態を更新
            setAuthState({
              isAuthenticated: true,
              token: storedToken
            });
            console.log('[Auth] 有効なトークンで認証状態を更新');
          } else {
            // 無効なトークンの場合、認証状態をクリア
            clearAuthState();
            console.log('[Auth] 無効なトークン、認証状態をクリア');
          }
        } else {
          // トークンが存在しない場合、認証状態をクリア
          clearAuthState();
          console.log('[Auth] トークンなし、認証状態をクリア');
        }
      } catch (error) {
        console.error('[Auth] 初期化中にエラー:', error);
        if (isMounted) {
          clearAuthState();
        }
      } finally {
        if (isMounted) {
          setIsInitialized(true);
          setIsLoading(false);
          console.log('[Auth] 初期化完了:', {
            isAuthenticated: authState.isAuthenticated,
            hasToken: Boolean(authState.token),
            isInitialized: true,
            isLoading: false
          });
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []); // 依存配列は空のまま

  const login = useCallback(async (newToken: string) => {
    console.log('[Auth] ログイン処理を開始:', {
      currentState: {
        isAuthenticated: authState.isAuthenticated,
        isLoading,
        hasToken: Boolean(authState.token)
      }
    });
    
    setIsLoading(true);
    try {
      console.log('[Auth] トークン検証開始');
      if (!validateToken(newToken)) {
        throw new Error('無効なトークンが提供されました');
      }
      
      console.log('[Auth] トークンを保存開始');
      localStorage.setItem('access_token', newToken);
      
      console.log('[Auth] 認証状態の更新開始');
      // 状態更新を確実に行うため、Promiseを使用
      await new Promise<void>((resolve) => {
        setAuthState((prev) => {
          const newState = {
            isAuthenticated: true,
            token: newToken
          };
          console.log('[Auth] 状態更新中:', {
            prevState: prev,
            newState,
            isLoading: true
          });
          prevAuthStateRef.current = newState;
          // 状態が確実に更新された後にresolveを呼び出す
          setTimeout(resolve, 0);
          return newState;
        });
      });

      // 状態の更新を確認
      console.log('[Auth] 状態更新後の確認:', {
        currentState: {
          isAuthenticated: authState.isAuthenticated,
          token: authState.token,
          isLoading: true
        }
      });
      
      console.log('[Auth] ログイン成功');
      return true;
    } catch (error) {
      console.error('[Auth] ログイン処理でエラー:', error);
      clearAuthState();
      return false;
    } finally {
      // 最後にisLoadingをfalseに設定
      setIsLoading(false);
      console.log('[Auth] ログイン処理完了:', {
        finalState: {
          isAuthenticated: authState.isAuthenticated,
          isLoading: false,
          hasToken: Boolean(authState.token)
        }
      });
    }
  }, [validateToken, clearAuthState, authState, isLoading]);

  const logout = useCallback(async () => {
    console.log('[Auth] ログアウト処理を開始')
    setIsLoading(true)
    try {
      clearAuthState()
      console.log('[Auth] ログアウト成功')
    } catch (error) {
      console.error('[Auth] ログアウト処理でエラー:', error)
    } finally {
      setIsLoading(false)
      console.log('[Auth] ログアウト処理完了')
    }
  }, [clearAuthState])

  const contextValue: AuthContextType = {
    isAuthenticated: authState.isAuthenticated,
    token: authState.token,
    login,
    logout,
    isInitialized,
    isLoading
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
