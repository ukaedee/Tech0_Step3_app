/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { test, expect } from '@jest/globals';
import App from './App';
import { AuthProvider } from '../src/context/AuthContext';

test('アプリケーションが正常にレンダリングされること', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  const headerElement = screen.getByRole('banner') as HTMLElement;
  expect(headerElement).toBeInTheDocument();
});
