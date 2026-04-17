'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface TopbarProps {
  onHamburgerClick: () => void;
}

const routeTitles: Record<string, string> = {
  '/tools': 'Dashboard',
  '/tools/audio-speed': 'Audio Speed Changer',
};

export default function Topbar({ onHamburgerClick }: TopbarProps) {
  const pathname = usePathname();
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const title = routeTitles[pathname] ?? 'Tools';
  const breadcrumbs = pathname.split('/').filter(Boolean);

  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-16 flex items-center justify-between px-5 z-20"
      style={{
        height: '60px',
        background: 'rgba(9,9,16,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1e1e2e',
      }}
    >
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Hamburger - visible on mobile */}
        <button
          onClick={onHamburgerClick}
          className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'rgba(124,106,247,0.1)', color: '#a78bfa' }}
          aria-label="Toggle menu"
          id="hamburger-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: '#6b6b80' }}>tools</span>
          {breadcrumbs.slice(1).map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              <span style={{ color: '#2a2a40' }}>/</span>
              <span className="text-xs font-mono" style={{ color: '#a78bfa' }}>{crumb}</span>
            </span>
          ))}
        </div>

        {/* Title - desktop */}
        <div className="hidden md:flex items-center gap-3">
          <div className="w-px h-4" style={{ background: '#1e1e2e' }} />
          <h1 className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>{title}</h1>
        </div>
      </div>

      {/* Right: indicators */}
      <div className="flex items-center gap-3">
        {/* Clock */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid #2a2a40' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-mono" style={{ color: '#6b6b80' }}>{time}</span>
        </div>

        {/* Notification bell */}
        <button
          className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{ background: 'rgba(124,106,247,0.06)', color: '#6b6b80', border: '1px solid #1e1e2e' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '#3d3580';
            (e.currentTarget as HTMLElement).style.color = '#a78bfa';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '#1e1e2e';
            (e.currentTarget as HTMLElement).style.color = '#6b6b80';
          }}
          aria-label="Notifications"
          id="topbar-notifications-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4.5 h-4.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 select-none"
          style={{
            background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
            color: '#fff',
            boxShadow: '0 0 12px #7c6af740',
            cursor: 'default',
          }}>
          S
        </div>
      </div>
    </header>
  );
}
