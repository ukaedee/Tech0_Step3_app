'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
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

interface UserInfo {
  employee_id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  icon_url?: string;
}

const Dashboard: React.FC = () => {
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
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const [userResponse, employeesResponse] = await Promise.all([
          axios.get('http://localhost:8001/me', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:8001/employees', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setUserInfo(userResponse.data);
        setEmployees(employeesResponse.data);
      } catch (err: any) {
        setError('情報の取得に失敗しました');
        if (err.response?.status === 401) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const updatedProfile = {
        department: profile.department,
        icon_url: tempIconUrl || profile.icon_url,
      };
      await axios.put(
        'http://localhost:8001/me/profile',
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

  const handlePasswordChange = async () => {
    if (password.new !== password.confirm) {
      setError('新しいパスワードが一致しません');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:8001/me/password',
        {
          current_password: password.current,
          new_password: password.new,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOpenPasswordDialog(false);
      setPassword({ current: '', new: '', confirm: '' });
    } catch (err) {
      setError('パスワードの更新に失敗しました');
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
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
          'http://localhost:8001/upload-image',
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
        <Typography variant="h4" component="h1" gutterBottom>
          ダッシュボード
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {userInfo && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  ユーザー情報
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Avatar
                    src={userInfo.icon_url}
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
                  >
                    パスワード変更
                  </Button>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  従業員一覧
                </Typography>
                <List>
                  {employees.map((employee) => (
                    <ListItem key={employee.employee_id}>
                      <ListItemAvatar>
                        <Avatar src={employee.icon_url} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={employee.name}
                        secondary={`${employee.department || '部署未設定'} - ${employee.role}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={handleLogout}
          sx={{ mt: 3 }}
        >
          ログアウト
        </Button>

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
      </Box>
    </Container>
  );
};

export default Dashboard; 
