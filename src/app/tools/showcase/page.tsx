'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

const cards = [
  { src: '/showcase_card_1.png', label: 'Aurora Wellness',  tag: 'Health & Fitness', color: '#7c6af7' },
  { src: '/showcase_card_2.png', label: 'Aura Dashboard',   tag: 'Analytics',        color: '#06b6d4' },
  { src: '/showcase_card_3.png', label: 'Analytics Pro',    tag: 'Finance',          color: '#f59e0b' },
  { src: '/showcase_card_4.png', label: 'Ethereal Social',  tag: 'Social Media',     color: '#ec4899' },
  { src: '/showcase_card_5.png', label: 'FitTrack',         tag: 'Fitness',          color: '#10b981' },
  { src: '/showcase_card_6.png', label: 'Aether Store',     tag: 'E-Commerce',       color: '#6366f1' },
];

const N = cards.length;

/** Visible cards per breakpoint */
function getVisibleCount(vw: number) {
  if (vw >= 1100) return 6;
  if (vw >= 800)  return 5;
  if (vw >= 560)  return 4;
  return 3;
}

/**
 * TRUE CIRCULAR arc transform.
 * Cards sit on a large circle of radius R.
 * angle = offset * angleStep (radians)
 *   x = R·sin(angle)               → cards spread left/right
 *   z = R·(1 − cos(angle))         → concave: 0 at center, positive at edges (forward)
 *   rotateY = −angle·(180/π)·0.8   → edges tilt inward to face viewer
 */
function getTransform(
  offset: number,
  angleStep: number, // radians per card slot
  R: number,         // arc radius in px
  visible: number,
) {
  const angle = offset * angleStep;
  const dist  = Math.abs(offset);

  const x        = R * Math.sin(angle);
  const z        = R * (1 - Math.cos(angle)); // concave bowl

  // Scale: center small, edges large
  const scale    = 0.58 + dist * 0.155;

  // Cards rotate so they always face the centre of the screen
  const rotateY  = -(angle * 180) / Math.PI * 0.78;

  // Slight vertical dip at edges (small, just for polish)
  const translateY = dist * dist * 2.5;

  // Hide cards that are off-screen
  const opacity  = dist > visible / 2 + 0.15 ? 0 : Math.min(1, 0.42 + dist * 0.38);

  // Edges render on top
  const zIndex   = Math.round(2 + dist * 4);

  return { x, z, scale, rotateY, translateY, opacity, zIndex };
}

export default function ShowcasePage() {
  const cardRefsRef  = useRef<(HTMLDivElement | null)[]>(Array(N).fill(null));
  const rafRef       = useRef<number>(0);
  const lastTRef     = useRef<number>(0);
  const centerRef    = useRef<number>(0);
  const hoverRef     = useRef<number>(0); // count of cards currently hovered
  const angleStepRef = useRef<number>(0.45);
  const radiusRef    = useRef<number>(1400);
  const visibleRef   = useRef<number>(6);
  const cardWRef     = useRef<number>(180);
  const cardHRef     = useRef<number>(308);

  /** Recompute arc geometry from viewport size */
  const updateLayout = () => {
    const sidebarW = window.innerWidth >= 1024 ? 64 : 0;
    const avail    = window.innerWidth - sidebarW;
    const visible  = getVisibleCount(avail);
    visibleRef.current = visible;

    // Radius: large enough that the arc feels smooth, not too bent
    const R = Math.max(900, avail * 0.85);
    radiusRef.current = R;

    // We want visible/2 card slots to land at x ≈ avail/2
    // R·sin(halfSlots · step) = avail/2
    const halfSlots = visible / 2;
    const sinVal    = Math.min(0.97, (avail / 2) / R);
    const halfAngle = Math.asin(sinVal);
    angleStepRef.current = halfAngle / halfSlots;

    // Card width: avail / visible with a tight gap ratio
    const cw = Math.max(90, Math.round((avail / visible) * 0.93));
    const ch = Math.round(cw * 1.72);
    cardWRef.current = cw;
    cardHRef.current = ch;

    cardRefsRef.current.forEach(el => {
      if (!el) return;
      el.style.width  = `${cw}px`;
      el.style.height = `${ch}px`;
      el.style.left   = `${-cw / 2}px`;
      el.style.top    = `${-ch / 2}px`;
    });
  };

  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // RAF loop — pure DOM mutation, zero React re-renders
  useEffect(() => {
    const animate = (ts: number) => {
      if (!lastTRef.current) lastTRef.current = ts;
      const dt = ts - lastTRef.current;
      lastTRef.current = ts;

      // Only advance when NO card is hovered
      if (hoverRef.current === 0) {
        centerRef.current = (centerRef.current + dt * 0.00052) % N;
      }

      const center    = centerRef.current;
      const angleStep = angleStepRef.current;
      const R         = radiusRef.current;
      const visible   = visibleRef.current;

      for (let i = 0; i < N; i++) {
        const el = cardRefsRef.current[i];
        if (!el) continue;

        // Circular wrap into (−N/2, N/2)
        let off = i - center;
        while (off >  N / 2) off -= N;
        while (off < -N / 2) off += N;

        const t = getTransform(off, angleStep, R, visible);
        el.style.transform   = `translateX(${t.x}px) translateY(${t.translateY}px) translateZ(${t.z}px) rotateY(${t.rotateY}deg) scale(${t.scale})`;
        el.style.opacity     = String(t.opacity);
        el.style.zIndex      = String(t.zIndex);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg, #07070f 0%, #0b0b18 45%, #08080f 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Ambient glows */}
      <div style={{ position:'absolute', top:'-5%', left:'50%', transform:'translateX(-50%)',
        width:'min(900px,100vw)', height:400, borderRadius:'50%', pointerEvents:'none', filter:'blur(60px)',
        background:'radial-gradient(ellipse, rgba(124,106,247,0.14) 0%, transparent 70%)' }} />
      <div style={{ position:'absolute', bottom:'5%', left:'15%',
        width:500, height:300, pointerEvents:'none', filter:'blur(50px)',
        background:'radial-gradient(ellipse, rgba(236,72,153,0.09) 0%, transparent 70%)' }} />
      <div style={{ position:'absolute', top:'35%', right:'8%',
        width:400, height:400, pointerEvents:'none', filter:'blur(50px)',
        background:'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)' }} />

      {/* ── Hero ── */}
      <div style={{ textAlign:'center', marginBottom:44, zIndex:10, padding:'0 20px', maxWidth:560 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'6px 18px', borderRadius:100, marginBottom:18,
          background:'rgba(124,106,247,0.1)', border:'1px solid rgba(124,106,247,0.3)',
          color:'#a78bfa', fontSize:11, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.08em',
        }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#a78bfa',
            display:'inline-block', animation:'dotPulse 2s ease-in-out infinite' }} />
          LIVE SHOWCASE · {N} TEMPLATES
        </div>

        <h1 style={{
          fontSize:'clamp(1.6rem, 4.2vw, 3.4rem)', fontWeight:800,
          fontFamily:'Syne, sans-serif', letterSpacing:'-0.03em',
          color:'#f0f0ff', lineHeight:1.1, marginBottom:12,
        }}>
          Website Templates for{' '}
          <span style={{
            background:'linear-gradient(135deg, #7c6af7 0%, #c084fc 45%, #ec4899 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          }}>
            Your Big Day
          </span>
        </h1>

        <p style={{ fontSize:'clamp(0.8rem,1.8vw,0.93rem)', color:'#6b6b80',
          maxWidth:380, margin:'0 auto', lineHeight:1.72 }}>
          Easy-to-customise, effortless to share.<br />
          Website Templates for your Big Day.
        </p>

        <button
          style={{
            marginTop:22, padding:'11px 28px', borderRadius:100,
            background:'#fff', border:'none', color:'#0a0a14',
            fontSize:'clamp(12px,1.5vw,14px)', fontWeight:700, cursor:'pointer',
            boxShadow:'0 4px 24px rgba(0,0,0,0.5)',
            transition:'transform 0.2s, box-shadow 0.2s',
            fontFamily:'Inter, sans-serif',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px) scale(1.02)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(124,106,247,0.45)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.5)';
          }}
        >
          Choose a template
        </button>
      </div>

      {/* ── 3-D Circular Arc Carousel ── */}
      <div style={{
        width:'100%', height:'clamp(280px,46vw,490px)',
        position:'relative', perspective:'1200px', perspectiveOrigin:'50% 50%', zIndex:5,
      }}>
        {/* Pivot = visual centre */}
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          width:0, height:0,
          transformStyle:'preserve-3d',
          transform:'translate(-50%, -50%)',
        }}>
          {cards.map((card, i) => (
            <div
              key={card.src}
              ref={el => { cardRefsRef.current[i] = el; }}
              style={{
                position:'absolute',
                width:180, height:308,
                left:-90, top:-154,
                willChange:'transform, opacity',
                borderRadius:18, overflow:'hidden',
                border:`1px solid ${card.color}45`,
                boxShadow:`0 20px 60px rgba(0,0,0,0.65), 0 4px 24px ${card.color}28`,
                cursor:'pointer',
                opacity:0,
                transition:'box-shadow 0.25s',
              }}
              /* Pause ONLY when hovering a card */
              onMouseEnter={() => { hoverRef.current += 1; }}
              onMouseLeave={() => { hoverRef.current = Math.max(0, hoverRef.current - 1); }}
            >
              {/* ALL loaded with priority — no lazy flicker */}
              <Image
                src={card.src}
                alt={card.label}
                fill
                sizes="(max-width:640px) 40vw, (max-width:1024px) 25vw, 220px"
                priority
                style={{ objectFit:'cover' }}
              />
              {/* Bottom label */}
              <div style={{
                position:'absolute', bottom:0, left:0, right:0,
                padding:'44px 12px 13px',
                background:'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
              }}>
                <div style={{ fontSize:9, fontFamily:'JetBrains Mono, monospace',
                  color:card.color, marginBottom:2, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                  {card.tag}
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:'#fff',
                  fontFamily:'Syne, sans-serif', letterSpacing:'-0.01em',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {card.label}
                </div>
              </div>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
                background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)' }} />
            </div>
          ))}
        </div>

        {/* Edge fades */}
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'12%',
          background:'linear-gradient(to right, #07070f, transparent)',
          zIndex:20, pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'12%',
          background:'linear-gradient(to left, #07070f, transparent)',
          zIndex:20, pointerEvents:'none' }} />
      </div>

      {/* ── Stats ── */}
      <div style={{ display:'flex', gap:'clamp(20px,4vw,52px)', marginTop:44,
        justifyContent:'center', flexWrap:'wrap', padding:'0 20px', zIndex:10 }}>
        {[
          { value:'6+',    label:'Templates'    },
          { value:'100K+', label:'Users'        },
          { value:'5★',    label:'Rating'       },
          { value:'∞',     label:'Customizable' },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center' }}>
            <div style={{
              fontSize:'clamp(1.4rem,3vw,2rem)', fontWeight:800, fontFamily:'Syne, sans-serif',
              background:'linear-gradient(135deg, #7c6af7, #a78bfa)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}>{s.value}</div>
            <div style={{ fontSize:'clamp(9px,1.2vw,11px)', color:'#4b4b60',
              fontFamily:'JetBrains Mono, monospace', marginTop:3 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity:1; transform:scale(1); }
          50%       { opacity:0.35; transform:scale(0.75); }
        }
      `}</style>
    </div>
  );
}
