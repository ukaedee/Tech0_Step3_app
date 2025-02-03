'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import axiosInstance from '@/lib/axios';

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formBody = new URLSearchParams();
      formBody.append('username', formData.email);
      formBody.append('password', formData.password);
      formBody.append('grant_type', 'password');

      const response = await axiosInstance.post('/token', 
        formBody,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );
      
      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);

      // ユーザー情報を取得して管理者かチェック
      const userResponse = await axiosInstance.get('/me');

      if (userResponse.data.role !== 'admin') {
        setError('管理者権限が必要です');
        localStorage.removeItem('access_token');
        return;
      }

      router.push('/admin/register');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('メールアドレスまたはパスワードが正しくありません');
      localStorage.removeItem('access_token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          管理者ログイン
        </Typography>
        <Typography variant="subtitle1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          管理者専用のログインページです
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
              disabled={isLoading}
              sx={{ 
                mt: 3, 
                mb: 2,
                backgroundColor: '#1976d2 !important',
                color: 'white !important',
                padding: '6px 16px !important',
                fontSize: '14px !important',
                fontWeight: 500,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#1565c0 !important'
                },
                '&:disabled': {
                  backgroundColor: '#ccc !important',
                  color: 'rgba(255,255,255,0.7) !important'
                },
                '& .MuiCircularProgress-root': {
                  color: 'white !important'
                }
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'ログイン'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
} 