'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Fixed grid background */}
      <div className="fixed inset-0 pointer-events-none z-0 grid-bg" />

      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Topbar onHamburgerClick={() => setMobileOpen(prev => !prev)} />

      {/* Main content: no left offset on mobile (sidebar hidden), 64px on desktop */}
      <main
        className="relative z-10 min-h-screen ml-0 lg:ml-16"
        style={{
          marginTop: '60px',
          padding: '2rem',
        }}
      >
        {children}
      </main>
    </div>
  );
}
