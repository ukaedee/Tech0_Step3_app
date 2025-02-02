'use client'

import React, { useState } from 'react';
import axios from 'axios';

interface EmployeeRegisterData {
  employee_id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
}

export function EmployeeRegister() {
  const [formData, setFormData] = useState<EmployeeRegisterData>({
    employee_id: '',
    name: '',
    email: '',
    role: 'employee'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('送信するデータ:', formData); // デバッグ用
      const response = await axios.post(
        'http://localhost:8001/register',
        {
          employee_id: formData.employee_id,
          name: formData.name,
          email: formData.email,
          role: formData.role
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('レスポンス:', response.data); // デバッグ用
      setSuccess('従業員を登録しました。仮パスワードが登録されたメールアドレスに送信されます。');
      setError('');
      // フォームをリセット
      setFormData({
        employee_id: '',
        name: '',
        email: '',
        role: 'employee'
      });
    } catch (err: any) {
      console.error('エラー詳細:', err.response || err); // デバッグ用
      setError('登録に失敗しました: ' + (err.response?.data?.detail || err.message));
      setSuccess('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">従業員登録</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-red-600 bg-red-50 p-3 rounded">{error}</div>}
        {success && <div className="text-green-600 bg-green-50 p-3 rounded">{success}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700">従業員ID</label>
          <input
            type="text"
            required
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">名前</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">役割</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'employee' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="employee">従業員</option>
            <option value="admin">管理者</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          登録
        </button>
      </form>
    </div>
  );
} 