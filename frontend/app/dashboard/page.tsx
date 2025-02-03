'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';

interface UserInfo {
  employee_id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  icon_url?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, logout } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [department, setDepartment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnmounted, setIsUnmounted] = useState(false);
  const [isUserInfoLoading, setIsUserInfoLoading] = useState(false);
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  useEffect(() => {
    return () => {
      setIsUnmounted(true);
    };
  }, []);

  const fetchUserInfo = useCallback(async () => {
    if (isUnmounted || !isAuthenticated) return;
    
    setIsUserInfoLoading(true);
    try {
      const response = await axiosInstance.get('/me');
      if (!isUnmounted) {
        setUserInfo(response.data);
        setDepartment(response.data.department || '');
      }
    } catch (error) {
      if (!isUnmounted) {
        console.error('Failed to fetch user info:', error);
        setError('ユーザー情報の取得に失敗しました');
      }
    } finally {
      if (!isUnmounted) {
        setIsUserInfoLoading(false);
      }
    }
  }, [isUnmounted, isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;

    // 認証チェックを一度だけ行う
    let isFirstCheck = true;
    if (!isAuthenticated && isFirstCheck) {
      console.log('[Dashboard] 未認証ユーザーを検知、ログインページへリダイレクト');
      router.replace('/login');
      isFirstCheck = false;
      return;
    }

    if (isAuthenticated) {
      console.log('[Dashboard] 認証済みユーザーを検知、ユーザー情報を取得');
      fetchUserInfo();
    }
  }, [isLoading, isAuthenticated, router, fetchUserInfo]);

  const handleProfileUpdate = async () => {
    if (isUnmounted) return;

    try {
      await axiosInstance.put('/me/profile', {
        department: department,
      });
      if (!isUnmounted) {
        await fetchUserInfo();
        setOpenProfileDialog(false);
      }
    } catch (error) {
      if (!isUnmounted) {
        console.error('Failed to update profile:', error);
        setError('プロフィールの更新に失敗しました');
      }
    }
  };

  const handlePasswordChange = async () => {
    if (isUnmounted) return;

    if (password.new !== password.confirm) {
      setError('新しいパスワードが一致しません');
      return;
    }

    try {
      await axiosInstance.put('/me/password', {
        current_password: password.current,
        new_password: password.new,
      });
      if (!isUnmounted) {
        setOpenPasswordDialog(false);
        setPassword({ current: '', new: '', confirm: '' });
      }
    } catch (error) {
      if (!isUnmounted) {
        console.error('Failed to change password:', error);
        setError('パスワードの変更に失敗しました');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      if (!isUnmounted) {
        setError('ログアウトに失敗しました');
      }
    }
  };

  if (isLoading || isUserInfoLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated || !userInfo) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            マイページ
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={handleLogout}
          >
            ログアウト
          </Button>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={userInfo.icon_url}
              sx={{ width: 80, height: 80, mr: 2 }}
            />
            <Box>
              <Typography variant="h6">{userInfo.name}</Typography>
              <Typography color="textSecondary">{userInfo.email}</Typography>
              <Typography color="textSecondary">
                {userInfo.department || '部署未設定'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setOpenProfileDialog(true)}
            >
              プロフィール編集
            </Button>
            <Button
              variant="outlined"
              onClick={() => setOpenPasswordDialog(true)}
            >
              パスワード変更
            </Button>
          </Box>
        </Paper>

        {userInfo.role === 'admin' && (
          <Button
            variant="contained"
            onClick={() => router.push('/admin/dashboard')}
            sx={{ mr: 2 }}
          >
            管理者画面へ
          </Button>
        )}
      </Box>

      {/* プロフィール編集ダイアログ */}
      <Dialog open={openProfileDialog} onClose={() => setOpenProfileDialog(false)}>
        <DialogTitle>プロフィール編集</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="部署"
            fullWidth
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProfileDialog(false)}>キャンセル</Button>
          <Button onClick={handleProfileUpdate}>更新</Button>
        </DialogActions>
      </Dialog>

      {/* パスワード変更ダイアログ */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
        <DialogTitle>パスワード変更</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="現在のパスワード"
            type="password"
            fullWidth
            value={password.current}
            onChange={(e) => setPassword({ ...password, current: e.target.value })}
          />
          <TextField
            margin="dense"
            label="新しいパスワード"
            type="password"
            fullWidth
            value={password.new}
            onChange={(e) => setPassword({ ...password, new: e.target.value })}
          />
          <TextField
            margin="dense"
            label="新しいパスワード（確認）"
            type="password"
            fullWidth
            value={password.confirm}
            onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>キャンセル</Button>
          <Button onClick={handlePasswordChange}>変更</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 