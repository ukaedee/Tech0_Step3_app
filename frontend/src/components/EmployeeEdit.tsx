'use client'

import React, { useState } from 'react';
import axios from 'axios';

interface EmployeeUpdateData {
  name?: string;
  department?: string;
  password?: string;
}

export const EmployeeEdit: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const [formData, setFormData] = useState<EmployeeUpdateData>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8000/employees/${employeeId}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSuccess('更新が完了しました');
      setError('');
    } catch (err) {
      setError('更新に失敗しました');
      setSuccess('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}
      
      <div>
        <label className="block text-sm font-medium text-gray-700">名前</label>
        <input
          type="text"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">部署</label>
        <input
          type="text"
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">新しいパスワード</label>
        <input
          type="password"
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        更新
      </button>
    </form>
  );
}; 