'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

const queryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000,
      retry: 1,
    },
  },
}

export function Providers({ children }: { children: React.ReactNode }) {
  console.log('Providers props:', {
    children: JSON.stringify(children, null, 2)
  });

  const [queryClient] = useState(
    () => {
      const client = new QueryClient(queryClientOptions);
      console.log('QueryClient config:', JSON.stringify(queryClientOptions));
      return client;
    }
  )

  const serializedProps = {
    children: children,
    queryClientConfig: queryClientOptions
  };
  console.log('Serialized Providers props:', JSON.stringify(serializedProps, null, 2));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}