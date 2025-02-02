'use client'

import React, { useState } from 'react';
import axios from 'axios';

export function DbTest() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testConnection = async () => {
    try {
      const response = await axios.get('http://localhost:8001/test-db');
      setStatus('接続成功！');
      setError('');
    } catch (err) {
      setError('接続エラー: ' + (err as Error).message);
      setStatus('');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">DB接続テスト</h1>
      <button
        onClick={testConnection}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        DB接続テスト
      </button>
      {status && <div className="text-green-600 mt-2">{status}</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
} 