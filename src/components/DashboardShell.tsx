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

      {/* Main content - offset for collapsed sidebar (64px) */}
      <main
        className="relative z-10 min-h-screen"
        style={{
          marginLeft: '64px',
          marginTop: '60px',
          padding: '2rem',
          transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {children}
      </main>
    </div>
  );
}
