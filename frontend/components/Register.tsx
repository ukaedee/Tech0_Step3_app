import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface Employee {
  employee_id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  icon_url?: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    email: '',
    password: '',
    department: '',
    role: 'employee',
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8001/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(response.data);
    } catch (err) {
      setError('従業員情報の取得に失敗しました');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:8001/employees',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess(true);
      setFormData({
        employee_id: '',
        name: '',
        email: '',
        password: '',
        department: '',
        role: 'employee',
      });
      fetchEmployees(); // 従業員リストを更新
    } catch (err: any) {
      setError(err.response?.data?.detail || '従業員の登録に失敗しました');
    }
  };

  const handleDeleteClick = (employeeId: string) => {
    setEmployeeToDelete(employeeId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8001/employees/${employeeToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEmployees(); // 従業員リストを更新
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
    } catch (err) {
      setError('従業員の削除に失敗しました');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          従業員管理
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            従業員を登録しました
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* 登録フォーム */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                新規登録
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="従業員ID"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="名前"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="メールアドレス"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
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
                <TextField
                  margin="normal"
                  fullWidth
                  label="部署"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  select
                  label="役割"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <MenuItem value="employee">従業員</MenuItem>
                  <MenuItem value="admin">管理者</MenuItem>
                </TextField>

                <Box sx={{ mt: 3 }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                  >
                    登録
                  </Button>
                </Box>
              </form>
            </Paper>
          </Grid>

          {/* 従業員一覧 */}
          <Grid item xs={12} md={8}>
            <Paper>
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
                            onClick={() => handleDeleteClick(employee.employee_id)}
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
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/dashboard')}
          >
            ダッシュボードに戻る
          </Button>
        </Box>

        {/* 削除確認ダイアログ */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <DialogTitle>確認</DialogTitle>
          <DialogContent>
            この従業員を削除してもよろしいですか？
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleDeleteConfirm} color="error">
              削除
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Register; 