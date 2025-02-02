'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
} from '@mui/material';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // axiosInstanceの設定を確認
      console.log('Axios config:', {
        baseURL: axiosInstance.defaults.baseURL,
        timeout: axiosInstance.defaults.timeout,
        withCredentials: axiosInstance.defaults.withCredentials
      });

      console.log('Login attempt:', {
        url: '/token',
        fullUrl: `${axiosInstance.defaults.baseURL}/token`,
        email: formData.email,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      const response = await axiosInstance.post('/token', 
        new URLSearchParams({
          username: formData.email,
          password: formData.password,
          grant_type: 'password'
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Login response:', response.data);
      
      if (!response.data) {
        throw new Error('レスポンスデータがありません');
      }

      const { access_token } = response.data;
      if (!access_token) {
        throw new Error('トークンが見つかりません');
      }

      // トークンをlocalStorageとCookieに保存
      localStorage.setItem('access_token', access_token);
      document.cookie = `access_token=${access_token}; path=/; max-age=86400; samesite=lax`;

      // ユーザー情報を取得
      const userResponse = await axiosInstance.get('/me', {
        headers: { 
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json'
        }
      });

      console.log('User info:', userResponse.data);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      });
      
      if (err.message === 'Network Error') {
        setError('サーバーに接続できません。ネットワーク接続を確認してください。');
      } else {
        setError('メールアドレスまたはパスワードが正しくありません');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAdminClick = () => {
    window.location.href = '/admin/login';
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          従業員ログイン
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="メールアドレス"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="パスワード"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              ログイン
            </Button>
          </form>
        </Paper>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            onClick={handleAdminClick}
            sx={{
              color: '#1976d2',
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline'
              }
            }}
          >
            管理者の方はこちら
          </Button>
        </Box>
      </Box>
    </Container>
  );
} 