'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// アイコンURLを修正する関数
const getFullIconUrl = (iconUrl: string | undefined) => {
  if (!iconUrl) return undefined;
  if (iconUrl.startsWith('http')) return iconUrl;
  // APIのベースURLを使用して完全なURLを生成
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${baseUrl}${iconUrl}`;
};

interface UserInfo {
  employee_id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  icon_url?: string;
}

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [employees, setEmployees] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [profile, setProfile] = useState({
    department: '',
    icon_url: '',
  });
  const [tempIconUrl, setTempIconUrl] = useState<string | null>(null);
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, employeesResponse] = await Promise.all([
          axiosInstance.get('/me'),
          axiosInstance.get('/employees'),
        ]);

        console.log('User info:', userResponse.data);
        console.log('Employees:', employeesResponse.data);

        setUserInfo(userResponse.data);
        setEmployees(employeesResponse.data);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('情報の取得に失敗しました');
        if (err.response?.status === 401) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    if (!localStorage.getItem('access_token')) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      // まずログアウト処理を実行
      await logout();
      
      // 少し待ってからリダイレクト
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // window.locationを使用して強制的にリダイレクト
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // エラーが発生しても強制的にリダイレクト
      window.location.href = '/login';
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const updatedProfile = {
        department: profile.department,
        icon_url: tempIconUrl || profile.icon_url,
      };
      await axiosInstance.put(
        '/me/profile',
        updatedProfile,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUserInfo(prev => prev ? { ...prev, ...updatedProfile } : null);
      setTempIconUrl(null);
      setOpenProfileDialog(false);
    } catch (err) {
      setError('プロフィールの更新に失敗しました');
    }
  };

  const validatePassword = (password: string): boolean => {
    // 最低8文字、英数字を含む
    return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  };

  const handlePasswordChange = async () => {
    setError('');
    console.log('パスワード変更処理開始');

    // バリデーション
    if (!password.current || !password.new || !password.confirm) {
      setError('すべての項目を入力してください');
      return;
    }

    if (password.new !== password.confirm) {
      setError('新しいパスワードが一致しません');
      return;
    }

    if (!validatePassword(password.new)) {
      setError('新しいパスワードは8文字以上で、英字と数字を含める必要があります');
      return;
    }

    if (password.current === password.new) {
      setError('新しいパスワードが現在のパスワードと同じです');
      return;
    }

    try {
      console.log('パスワード変更APIを呼び出し');
      await axiosInstance.put('/me/password', {
        current_password: password.current,
        new_password: password.new,
      });

      // 成功時の処理
      setOpenPasswordDialog(false);
      setPassword({ current: '', new: '', confirm: '' });
      // 成功メッセージを表示
      alert('パスワードが正常に変更されました');
      setError('');
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.response?.status === 401) {
        setError('現在のパスワードが正しくありません');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('パスワードの更新に失敗しました。もう一度お試しください');
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // プレビューURLを作成
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // 自動アップロード
      try {
        setUploadProgress(true);
        const token = localStorage.getItem('access_token');
        const formData = new FormData();
        formData.append('file', file);

        const response = await axiosInstance.post(
          '/upload-image',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        setTempIconUrl(response.data.url);
        setSelectedFile(null);
      } catch (err) {
        setError('画像のアップロードに失敗しました');
      } finally {
        setUploadProgress(false);
      }
    }
  };

  // ダイアログを閉じる時にプレビューとテンポラリーデータをクリア
  const handleCloseProfileDialog = () => {
    setOpenProfileDialog(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    setTempIconUrl(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            ダッシュボード
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleLogout}
          >
            ログアウト
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {userInfo && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              ユーザー情報
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Avatar
                src={getFullIconUrl(userInfo.icon_url)}
                sx={{ width: 100, height: 100, mb: 2 }}
              />
              <Typography><strong>従業員ID:</strong> {userInfo.employee_id}</Typography>
              <Typography><strong>名前:</strong> {userInfo.name}</Typography>
              <Typography><strong>メールアドレス:</strong> {userInfo.email}</Typography>
              <Typography><strong>役割:</strong> {userInfo.role}</Typography>
              <Typography><strong>部署:</strong> {userInfo.department || '未設定'}</Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setOpenProfileDialog(true)}
                sx={{ mr: 1 }}
              >
                プロフィール編集
              </Button>
              <Button
                variant="outlined"
                onClick={() => setOpenPasswordDialog(true)}
                sx={{ mr: 1 }}
              >
                パスワード変更
              </Button>
              {userInfo.role === 'admin' && (
                <Button
                  variant="outlined"
                  onClick={() => router.push('/admin/dashboard')}
                >
                  従業員管理
                </Button>
              )}
            </Box>
          </Paper>
        )}
        {employees.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              従業員一覧
            </Typography>
            <List>
              {employees.map((employee) => (
                <ListItem key={employee.employee_id}>
                  <ListItemAvatar>
                    <Avatar src={getFullIconUrl(employee.icon_url)} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={employee.name}
                    secondary={`${employee.department || '部署未設定'} - ${employee.email}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* プロフィール編集ダイアログ */}
        <Dialog 
          open={openProfileDialog} 
          onClose={handleCloseProfileDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>プロフィール編集</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              {/* 現在のアイコンまたはプレビュー */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Avatar
                  src={previewUrl || tempIconUrl || userInfo?.icon_url}
                  sx={{ width: 150, height: 150 }}
                />
              </Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="icon-file-input"
                type="file"
                onChange={handleFileSelect}
                disabled={uploadProgress}
              />
              <label htmlFor="icon-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  disabled={uploadProgress}
                >
                  {uploadProgress ? 'アップロード中...' : 'アイコン画像を選択'}
                </Button>
              </label>
            </Box>
            <TextField
              margin="dense"
              label="部署"
              fullWidth
              value={profile.department}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseProfileDialog}>キャンセル</Button>
            <Button onClick={handleProfileUpdate}>更新</Button>
          </DialogActions>
        </Dialog>

        {/* パスワード変更ダイアログ */}
        <Dialog 
          open={openPasswordDialog} 
          onClose={() => setOpenPasswordDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>パスワード変更</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
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
              helperText="8文字以上で、英字と数字を含める必要があります"
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
            <Button onClick={() => setOpenPasswordDialog(false)}>
              キャンセル
            </Button>
            <Button 
              onClick={handlePasswordChange}
              variant="contained"
              color="primary"
            >
              変更
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Dashboard; 
