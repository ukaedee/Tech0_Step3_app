'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      console.log('[Login] 認証状態チェック開始:', {
        isAuthenticated,
        isLoading,
        pathname: window.location.pathname
      });

      if (!isLoading && isAuthenticated && window.location.pathname === '/login') {
        console.log('[Login] 認証済みユーザーを検知、ダッシュボードへリダイレクト開始');
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const redirectToPath = '/dashboard';
          try {
            await router.replace(redirectToPath);
            console.log('[Login] Next.jsルーターでのリダイレクト完了');
          } catch (routerError) {
            console.warn('[Login] Next.jsルーターでのリダイレクト失敗、window.locationを使用:', routerError);
            window.location.href = redirectToPath;
          }
        } catch (error) {
          console.error('[Login] リダイレクト処理でエラー:', error);
        }
      } else {
        console.log('[Login] リダイレクト条件未満:', {
          isLoading,
          isAuthenticated,
          pathname: window.location.pathname,
          shouldRedirect: !isLoading && isAuthenticated
        });
      }
    };

    checkAuthAndRedirect();
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Login] ログインフォーム送信開始');
    setError(null);
    setIsSubmitting(true);

    try {
      console.log('[Login] ログインAPIを呼び出し');
      const formBody = new URLSearchParams();
      formBody.append('username', formData.email);
      formBody.append('password', formData.password);
      formBody.append('grant_type', 'password');

      const response = await axiosInstance.post('/token', formBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      
      console.log('[Login] ログインAPI成功、トークンを保存開始');
      const loginSuccess = await login(response.data.access_token);
      
      if (loginSuccess) {
        console.log('[Login] ログイン成功、ダッシュボードにリダイレクト開始');
        router.replace('/dashboard'); // ログイン後即時リダイレクト
      } else {
        console.log('[Login] ログイン失敗');
        setError('ログイン処理に失敗しました。もう一度お試しください。');
      }
    } catch (error: any) {
      console.error('[Login] ログイン処理でエラー:', error);
      setError(
        error.response?.data?.detail || 
        'ログインに失敗しました。メールアドレスとパスワードを確認してください。'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            ログイン
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="メールアドレス"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isSubmitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="パスワード"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
} 