'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 現在のパスがルートの場合のみリダイレクト
    if (pathname === '/') {
      router.push('/login');
}
  }, [pathname, router]);
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>
      <CircularProgress />
    </Box>
  );
} 
