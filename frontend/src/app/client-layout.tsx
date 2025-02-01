'use client'

import { ReactNode, Suspense } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { Providers } from './providers'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

const ErrorFallback = ({ error }: FallbackProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold">エラーが発生しました</h2>
        <p className="text-sm text-gray-600">{error.message}</p>
      </div>
    </div>
  )
}

const LoadingFallback = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div>Loading...</div>
    </div>
  )
}

export function ClientLayout({ children }: { children: ReactNode }) {
  console.log('ClientLayout props:', {
    children: JSON.stringify(children, null, 2)
  });

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingFallback />}>
        <Providers>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Providers>
      </Suspense>
    </ErrorBoundary>
  )
} 