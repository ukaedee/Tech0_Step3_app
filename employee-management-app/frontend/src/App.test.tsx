import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from '../src/context/AuthContext';

test('アプリケーションが正常にレンダリングされること', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  const headerElement = screen.getByRole('banner');
  expect(headerElement).toBeInTheDocument();
});
