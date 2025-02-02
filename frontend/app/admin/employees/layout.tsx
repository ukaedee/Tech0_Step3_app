import React from 'react';

export default function EmployeesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-grow p-6">
      {children}
    </main>
  );
} 