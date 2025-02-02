'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';

interface NewEmployeeData {
  employee_id: string;
  name: string;
  email: string;
  department: string;
  role: 'admin' | 'employee';
  password?: string;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewEmployeeData>({
    employee_id: '',
    name: '',
    email: '',
    department: '',
    role: 'employee',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const tempPassword = Math.random().toString(36).slice(-8);
      const requestData = {
        ...formData,
        password: tempPassword
      };

      console.log('Sending data to server:', requestData);
      const response = await axiosInstance.post('/employees', requestData);
      console.log('Employee creation response:', response.data);
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Error creating employee:', err);
      const errorDetail = err.response?.data?.detail;
      setErrorMessage(
        typeof errorDetail === 'string' 
          ? errorDetail 
          : '従業員の作成に失敗しました'
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          新規従業員登録
        </Typography>

        {errorMessage && (
          <Typography color="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Typography>
        )}

        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="従業員ID"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleInputChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="名前"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="メールアドレス"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              fullWidth
              label="部署"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              disabled={loading}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">役割</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                value={formData.role}
                label="役割"
                onChange={handleSelectChange}
                disabled={loading}
              >
                <MenuItem value="employee">一般従業員</MenuItem>
                <MenuItem value="admin">管理者</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ flex: 1 }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <span>登録中...</span>
                  </Box>
                ) : (
                  '登録'
                )}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => router.push('/admin/dashboard')}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                キャンセル
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
} 