'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface User {
  employee_id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // トークンの検証とユーザー情報の取得
      fetchUserInfo(token);
    }
  }, []);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await axios.get<User>('http://localhost:8000/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post<TokenResponse>('http://localhost:8000/token', {
        username: email,
        password: password,
      });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      await fetchUserInfo(access_token);
      router.push('/employees');
    } catch (error) {
      throw new Error('ログインに失敗しました');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 