'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/tools',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: 'Audio Speed',
    href: '/tools/audio-speed',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
    ),
    badge: 'NEW',
  },
  {
    label: 'Carousel Creator',
    href: '/tools/carousel',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 8h2M15 8h2M11 8h2" strokeLinecap="round"/>
      </svg>
    ),
    badge: 'NEW',
  },
  {
    label: 'Paper Animator',
    href: '/tools/paper-animator',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M4 4h16v16H4z" rx="2"/>
        <path d="M4 9h16"/>
        <path d="M8 4v5"/>
        <path d="M8 14h5"/>
        <path d="M8 17h8"/>
      </svg>
    ),
    badge: 'NEW',
  },
];

const bottomItems = [
  {
    label: 'GitHub',
    href: 'https://github.com/sankalp-OO7',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    ),
    external: true,
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [hovered, setHovered] = useState(false);
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const expanded = hovered || mobileOpen;

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setHovered(false), 150);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: expanded ? '240px' : '64px',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          background: 'linear-gradient(180deg, #0f0f1a 0%, #0d0d18 100%)',
          borderRight: '1px solid #1e1e2e',
          zIndex: 40,
        }}
        className={`
          fixed top-0 left-0 h-full flex flex-col overflow-hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform lg:transition-none
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-[60px] border-b border-[#1e1e2e] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c6af7, #a78bfa)', boxShadow: '0 0 16px #7c6af740' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span
            className="font-bold text-white text-sm tracking-wide whitespace-nowrap"
            style={{
              opacity: expanded ? 1 : 0,
              transition: 'opacity 0.2s',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            Sankalp&apos;s Tools
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <div className="px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  title={!expanded ? item.label : undefined}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative"
                  style={{
                    background: isActive ? 'rgba(124,106,247,0.15)' : 'transparent',
                    color: isActive ? '#a78bfa' : '#6b6b80',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(124,106,247,0.08)';
                      (e.currentTarget as HTMLElement).style.color = '#e8e8f0';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#6b6b80';
                    }
                  }}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-violet-400" />
                  )}
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span
                    className="text-sm font-medium whitespace-nowrap"
                    style={{ opacity: expanded ? 1 : 0, transition: 'opacity 0.15s' }}
                  >
                    {item.label}
                  </span>
                  {item.badge && expanded && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent-dim)' }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Section divider */}
          <div className="mx-4 my-4 border-t border-[#1e1e2e]" />

          <div className="px-2 space-y-1">
            {bottomItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                title={!expanded ? item.label : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                style={{ color: '#6b6b80' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(124,106,247,0.08)';
                  (e.currentTarget as HTMLElement).style.color = '#e8e8f0';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#6b6b80';
                }}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span
                  className="text-sm font-medium whitespace-nowrap"
                  style={{ opacity: expanded ? 1 : 0, transition: 'opacity 0.15s' }}
                >
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div
          className="px-4 py-4 border-t border-[#1e1e2e] flex-shrink-0 overflow-hidden"
          style={{ opacity: expanded ? 1 : 0, transition: 'opacity 0.15s' }}
        >
          <div className="text-[10px] font-mono whitespace-nowrap" style={{ color: '#6b6b80' }}>
            v1.0.0 · More tools coming soon
          </div>
        </div>
      </aside>
    </>
  );
}
