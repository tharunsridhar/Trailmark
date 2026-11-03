'use client';

import React from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { activeScreen } = useHandover();

  // Role selection and Focused AI Interview have their own dedicated full-screen layouts
  if (activeScreen === 'role-select' || activeScreen === 'interview') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
