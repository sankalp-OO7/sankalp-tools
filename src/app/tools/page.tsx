'use client';

import Link from 'next/link';

interface Tool {
  id: string;
  label: string;
  description: string;
  href: string;
  badge: string;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
  category: string;
  disabled?: boolean;
}

const tools: Tool[] = [
  {
    id: 'audio-speed',
    label: 'Audio Speed Changer',
    description: 'Change playback speed without altering pitch. Preview in-browser, export as WAV.',
    href: '/tools/audio-speed',
    badge: 'NEW',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-7 h-7">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
    ),
    gradient: 'from-violet-600/20 to-fuchsia-600/10',
    glow: '#7c6af7',
    category: 'Audio',
  },
  {
    id: 'carousel-creator',
    label: 'Carousel Creator',
    description: 'Build branded 1080×1080 carousels for shamsgs.com. Use AI to generate JSON, render slides and download as PNG.',
    href: '/tools/carousel',
    badge: 'NEW',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-7 h-7">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 8h2M15 8h2M11 8h2" strokeLinecap="round"/>
      </svg>
    ),
    gradient: 'from-amber-600/20 to-yellow-600/10',
    glow: '#C9A84C',
    category: 'Content',
  },
  {
    id: 'paper-animator',
    label: 'Paper Animator',
    description: 'Generate newspaper-style keyword highlight frames. Pick textures, customise themes via JSON, and export PNGs for reels & stories.',
    href: '/tools/paper-animator',
    badge: 'NEW',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-7 h-7">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18"/>
        <path d="M9 3v6"/>
        <path d="M7 14h6"/>
        <path d="M7 17h10"/>
      </svg>
    ),
    gradient: 'from-stone-600/20 to-yellow-800/10',
    glow: '#b5935a',
    category: 'Content',
  },
  {
    id: 'coming-soon-1',
    label: 'Image Compressor',
    description: 'Compress and resize images locally. Supports WebP, JPEG, PNG.',
    href: '#',
    badge: 'SOON',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-7 h-7">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    gradient: 'from-cyan-600/20 to-blue-600/10',
    glow: '#06b6d4',
    category: 'Image',
    disabled: true,
  },
  {
    id: 'coming-soon-2',
    label: 'Text Diff Tool',
    description: 'Compare two blocks of text and highlight the differences.',
    href: '#',
    badge: 'SOON',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-7 h-7">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    gradient: 'from-emerald-600/20 to-green-600/10',
    glow: '#10b981',
    category: 'Text',
    disabled: true,
  },
  {
    id: 'coming-soon-3',
    label: 'JSON Formatter',
    description: 'Beautify, minify, and validate JSON. Syntax highlighting included.',
    href: '#',
    badge: 'SOON',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-7 h-7">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    gradient: 'from-amber-600/20 to-orange-600/10',
    glow: '#f59e0b',
    category: 'Dev',
    disabled: true,
  },
];

const stats = [
  { label: 'Tools Available', value: '3', icon: '🛠️', sub: '+2 coming soon' },
  { label: 'Runs in Browser', value: '100%', icon: '🔒', sub: 'No data leaves your device' },
  { label: 'Cost', value: '$0', icon: '✨', sub: 'Forever free' },
];

function ToolCard({ tool }: { tool: Tool }) {
  const inner = (
    <div
      className={`relative flex flex-col h-full p-5 rounded-2xl transition-all duration-200 ${
        tool.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'
      }`}
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      onMouseEnter={e => {
        if (!tool.disabled) {
          (e.currentTarget as HTMLElement).style.borderColor = tool.glow + '60';
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${tool.glow}18`;
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${tool.gradient}`}
        style={{ color: tool.glow }}
      >
        {tool.icon}
      </div>

      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>{tool.label}</span>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0"
          style={{
            background: tool.badge === 'NEW' ? 'rgba(124,106,247,0.15)' : 'rgba(107,107,128,0.15)',
            color: tool.badge === 'NEW' ? '#a78bfa' : '#6b6b80',
            border: `1px solid ${tool.badge === 'NEW' ? '#3d3580' : '#2a2a40'}`,
          }}
        >
          {tool.badge}
        </span>
      </div>

      <p className="text-xs flex-1" style={{ color: '#6b6b80', lineHeight: '1.6' }}>{tool.description}</p>

      <div className="mt-4 flex items-center justify-between">
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)', color: '#4b4b60', border: '1px solid #1e1e2e' }}
        >
          {tool.category}
        </span>
        {!tool.disabled && (
          <span className="text-xs" style={{ color: tool.glow }}>Open →</span>
        )}
      </div>
    </div>
  );

  if (tool.disabled) return <div>{inner}</div>;
  return <Link href={tool.href} className="block h-full">{inner}</Link>;
}

export default function ToolsDashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome hero */}
      <div className="mb-10">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-mono"
          style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid #3d3580', color: '#a78bfa' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
          All tools run client-side · No server required
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold mb-3"
          style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
        >
          Welcome to{' '}
          <span style={{ background: 'linear-gradient(135deg, #7c6af7, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Sankalp&apos;s Tools
          </span>
        </h1>
        <p className="text-base" style={{ color: '#6b6b80', maxWidth: '520px' }}>
          A curated collection of browser-based tools. No installs, no accounts, no data sent anywhere — everything runs right here.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="text-2xl">{s.icon}</div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }}>{s.value}</div>
              <div className="text-xs font-semibold" style={{ color: '#9ca3af' }}>{s.label}</div>
              <div className="text-[10px] font-mono mt-0.5" style={{ color: '#4b4b60' }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tools grid */}
      <div className="mb-6">
        <h2
          className="text-sm font-semibold uppercase tracking-widest mb-4"
          style={{ color: '#6b6b80', fontFamily: 'JetBrains Mono, monospace' }}
        >
          All Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
