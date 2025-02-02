'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';

interface Employee {
  employee_id: string;
  name: string;
  email: string;
  department?: string;
  role: string;
  icon_url?: string;
}

const AdminDashboard = () => {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const router = useRouter();

  // 従業員一覧を取得
  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get('/employees');
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('従業員情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
    }
  }, [isAuthenticated]);

  // 削除ダイアログを開く
  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  // 従業員を削除
  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;

    try {
      await axiosInstance.delete(`/employees/${selectedEmployee.employee_id}`);
      setEmployees(employees.filter(emp => emp.employee_id !== selectedEmployee.employee_id));
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError('従業員の削除に失敗しました');
    }
  };

  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          管理者ダッシュボード
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">従業員一覧</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push('/admin/employees/new')}
            >
              新規従業員登録
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>アイコン</TableCell>
                  <TableCell>従業員ID</TableCell>
                  <TableCell>名前</TableCell>
                  <TableCell>メールアドレス</TableCell>
                  <TableCell>部署</TableCell>
                  <TableCell>役割</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.employee_id}>
                    <TableCell>
                      <Avatar src={employee.icon_url} />
                    </TableCell>
                    <TableCell>{employee.employee_id}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.department || '未設定'}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(employee)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Button
          variant="outlined"
          onClick={() => router.push('/dashboard')}
          sx={{ mr: 2 }}
        >
          ダッシュボードに戻る
        </Button>
      </Box>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>従業員の削除</DialogTitle>
        <DialogContent>
          <Typography>
            {selectedEmployee?.name} を削除してもよろしいですか？
            この操作は取り消せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard; 