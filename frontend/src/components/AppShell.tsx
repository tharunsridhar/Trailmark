'use client';

import React from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { activeScreen } = useHandover();

  // Role selection is full-screen, no sidebar/topbar
  if (activeScreen === 'role-select') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

