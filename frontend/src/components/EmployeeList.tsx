'use client'

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Employee {
  employee_id: string;
  name: string;
  email: string;
  department?: string;
  icon_url?: string;
}

export function EmployeeList() {
  const { data: employees, isLoading, error } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async (): Promise<Employee[]> => {
      const token = localStorage.getItem('token');
      const response = await axios.get<Employee[]>('http://localhost:8001/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div>エラーが発生しました</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">従業員一覧</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {employees?.map((employee) => (
          <div key={employee.employee_id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-4">
              {employee.icon_url ? (
                <img
                  src={employee.icon_url}
                  alt={employee.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl text-gray-500">
                    {employee.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium">{employee.name}</h3>
                <p className="text-gray-500">{employee.department || '部署未設定'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 