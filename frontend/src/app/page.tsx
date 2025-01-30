'use client'

import { DbTest } from '@/components/DbTest'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">DB接続テスト</h1>
      <DbTest />
    </main>
  )
} 