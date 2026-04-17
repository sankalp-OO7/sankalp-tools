'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

type DiffState = 'same' | 'shorter' | 'longer';

function fmtFull(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export default function AudioSpeedPage() {
  const [speed, setSpeedState] = useState(1.0);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [origDuration, setOrigDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeDisplay, setTimeDisplay] = useState('0:00 / 0:00');
  const [fileReady, setFileReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [procPct, setProcPct] = useState(0);
  const [procStatus, setProcStatus] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const audioElRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const currentFileRef = useRef<File | null>(null);
  const animRef = useRef<number>(0);

  const newDuration = origDuration > 0 ? origDuration / speed : 0;
  const diff = newDuration - origDuration;
  let diffState: DiffState = 'same';
  if (Math.abs(diff) >= 0.5) diffState = diff < 0 ? 'shorter' : 'longer';

  const setSpeed = useCallback((val: number) => {
    const clamped = Math.round(Math.max(0.25, Math.min(4.0, val)) * 100) / 100;
    setSpeedState(clamped);
    if (audioElRef.current) audioElRef.current.playbackRate = clamped;
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('audio/')) return;
    currentFileRef.current = file;
    const url = URL.createObjectURL(file);
    const audio = audioElRef.current!;
    audio.src = url;
    audio.playbackRate = speed;
    setFileName(file.name);
    setFileSize((file.size / 1024 / 1024).toFixed(2) + ' MB');
    setFileReady(false);

    audio.addEventListener('loadedmetadata', () => {
      setOrigDuration(audio.duration);
      setFileReady(true);
    }, { once: true });

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      try {
        audioBufferRef.current = await audioCtxRef.current.decodeAudioData((e.target!.result as ArrayBuffer).slice(0));
      } catch (err) {
        console.warn('AudioBuffer decode failed:', err);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [speed]);

  // Progress animation
  useEffect(() => {
    const audio = audioElRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (!audio.duration) return;
      setProgress((audio.currentTime / audio.duration) * 100);
      setTimeDisplay(`${fmt(audio.currentTime)} / ${fmt(audio.duration)}`);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setProgress(0); };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioElRef.current;
    if (!audio || !audio.src) return;
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    if (audio.paused) { audio.playbackRate = speed; audio.play(); }
    else audio.pause();
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioElRef.current;
    if (!audio?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  };

  function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numCh = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const wavData = new Float32Array(length * numCh);
    for (let c = 0; c < numCh; c++) {
      const ch = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) wavData[i * numCh + c] = ch[i];
    }
    const bytesPerSample = 2;
    const blockAlign = numCh * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = wavData.length * bytesPerSample;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);
    const writeStr = (off: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
    writeStr(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE'); writeStr(12, 'fmt '); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, numCh, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true); view.setUint16(34, bytesPerSample * 8, true);
    writeStr(36, 'data'); view.setUint32(40, dataSize, true);
    let off = 44;
    for (let i = 0; i < wavData.length; i++) {
      const s = Math.max(-1, Math.min(1, wavData[i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
    return arrayBuffer;
  }

  const download = async () => {
    if (!audioBufferRef.current) { alert('Audio not ready yet.'); return; }
    audioElRef.current?.pause();
    setProcessing(true); setProcPct(0); setProcStatus('Preparing offline render...');
    try {
      const buf = audioBufferRef.current;
      const newLength = Math.ceil(buf.length / speed);
      await new Promise(r => setTimeout(r, 50));
      setProcPct(10); setProcStatus('Setting up audio context...');

      const offlineCtx = new OfflineAudioContext(buf.numberOfChannels, newLength, buf.sampleRate);
      const src = offlineCtx.createBufferSource();
      src.buffer = buf; src.playbackRate.value = speed;
      src.connect(offlineCtx.destination); src.start(0);

      setProcPct(30); setProcStatus('Rendering audio...');
      let fake = 30;
      const iv = setInterval(() => {
        fake = Math.min(fake + 3, 85);
        setProcPct(Math.round(fake));
      }, 200);

      const rendered = await offlineCtx.startRendering();
      clearInterval(iv);
      setProcPct(90); setProcStatus('Encoding WAV...');
      await new Promise(r => setTimeout(r, 50));

      const wav = audioBufferToWav(rendered);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setProcPct(100); setProcStatus('Done!');
      await new Promise(r => setTimeout(r, 400));

      const a = document.createElement('a');
      a.href = url;
      a.download = (currentFileRef.current?.name.replace(/\.[^.]+$/, '') ?? 'audio') + `_${speed.toFixed(2)}x.wav`;
      a.click();
    } catch (err: unknown) {
      console.error(err);
      alert('Processing failed: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <audio ref={audioElRef} style={{ display: 'none' }} />

      {/* Processing overlay */}
      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="p-8 rounded-2xl text-center w-72" style={{ background: 'var(--card)', border: '1px solid var(--border-bright)' }}>
            <div className="text-base font-semibold mb-1" style={{ color: '#e8e8f0' }}>Processing Audio</div>
            <div className="text-xs font-mono mb-5" style={{ color: '#6b6b80' }}>{procStatus}</div>
            <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${procPct}%`, background: 'var(--accent)', transition: 'width 0.2s' }} />
            </div>
            <div className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{procPct}%</div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-4"
            style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid #3d3580', color: '#a78bfa' }}>
            ⚡ Audio Speed Studio
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
            Change Speed,{' '}
            <span style={{ background: 'linear-gradient(135deg, #7c6af7, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Not Pitch
            </span>
          </h1>
          <p className="text-sm font-mono" style={{ color: '#6b6b80' }}>// upload → adjust → preview → download</p>
        </div>

        {/* Upload zone */}
        <div
          id="upload-zone"
          className="relative mb-4 rounded-2xl text-center cursor-pointer transition-all duration-200"
          style={{
            background: dragOver ? '#1a1a28' : 'var(--card)',
            border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border-bright)'}`,
            padding: '2.5rem 1.5rem',
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <input type="file" accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" className="w-6 h-6">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className="text-sm font-semibold mb-1" style={{ color: '#e8e8f0' }}>Drop audio file here</div>
          <div className="text-xs font-mono" style={{ color: '#6b6b80' }}>MP3, WAV, M4A, OGG, FLAC supported</div>
        </div>

        {/* File info */}
        {fileName && (
          <div className="flex items-center gap-3 p-3 rounded-xl mb-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" className="w-4.5 h-4.5">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: '#e8e8f0' }}>{fileName}</div>
              <div className="text-xs font-mono" style={{ color: '#6b6b80' }}>
                {origDuration > 0 ? `Duration: ${fmtFull(origDuration)} · ` : ''}{fileSize}
              </div>
            </div>
          </div>
        )}

        {/* Controls card */}
        <div className="rounded-2xl p-6 space-y-6"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            opacity: fileReady ? 1 : 0.4,
            pointerEvents: fileReady ? 'auto' : 'none',
          }}>

          {/* Speed display */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#6b6b80' }}>Playback Speed</div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-6xl font-mono font-medium" style={{ color: 'var(--accent)', lineHeight: 1 }}>
                {speed.toFixed(2)}<span className="text-2xl" style={{ color: '#6b6b80' }}>x</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => setSpeed(speed + 0.01)}
                  className="w-11 h-11 rounded-xl font-mono text-xl flex items-center justify-center transition-all"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-bright)', color: 'var(--text)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-bright)'; }}>
                  +
                </button>
                <button onClick={() => setSpeed(speed - 0.01)}
                  className="w-11 h-11 rounded-xl font-mono text-xl flex items-center justify-center transition-all"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-bright)', color: 'var(--text)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-bright)'; }}>
                  −
                </button>
              </div>
            </div>
            {/* Slider */}
            <div className="mt-4">
              <input type="range" min="0.25" max="4.00" step="0.01" value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="w-full h-1 rounded cursor-pointer appearance-none"
                style={{ accentColor: 'var(--accent)', background: 'var(--border-bright)' }} />
              <div className="flex justify-between text-[10px] font-mono mt-1.5" style={{ color: '#4b4b60' }}>
                <span>0.25x</span><span>1x</span><span>2x</span><span>3x</span><span>4x</span>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#6b6b80' }}>Quick Presets</div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button key={p}
                  onClick={() => setSpeed(p)}
                  className="text-xs font-mono px-3 py-1 rounded-full transition-all"
                  style={{
                    background: speed === p ? 'var(--accent-glow)' : 'transparent',
                    border: `1px solid ${speed === p ? 'var(--accent-dim)' : 'var(--border-bright)'}`,
                    color: speed === p ? 'var(--accent)' : '#6b6b80',
                  }}>
                  {p === 1 ? '1x' : `${p}x`}
                </button>
              ))}
            </div>
          </div>

          {/* Duration stats */}
          {origDuration > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#6b6b80' }}>Duration Preview</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Original', value: fmtFull(origDuration), color: '#e8e8f0' },
                  { label: 'New Length', value: fmtFull(newDuration), color: 'var(--accent)' },
                  {
                    label: 'Difference',
                    value: diffState === 'same' ? '0s' : (diffState === 'shorter' ? '−' : '+') + fmtFull(Math.abs(diff)),
                    color: diffState === 'same' ? '#6b6b80' : diffState === 'shorter' ? 'var(--green)' : 'var(--red)',
                  },
                ].map(d => (
                  <div key={d.label} className="rounded-xl p-3 text-center"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="text-[9px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#4b4b60' }}>{d.label}</div>
                    <div className="text-lg font-mono font-medium" style={{ color: d.color }}>{d.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#6b6b80' }}>Preview Player</div>
            <div className="flex items-center gap-3">
              <button onClick={togglePlay}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)', color: 'var(--accent)' }}>
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="var(--accent)" className="w-4 h-4">
                    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="var(--accent)" className="w-4 h-4">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                )}
              </button>
              <div className="flex-1 cursor-pointer" onClick={seekTo}>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-bright)' }}>
                  <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--accent)', transition: 'width 0.1s linear' }} />
                </div>
              </div>
              <div className="text-xs font-mono whitespace-nowrap" style={{ color: '#6b6b80' }}>{timeDisplay}</div>
            </div>
          </div>

          {/* Download */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#6b6b80' }}>Export</div>
            <button onClick={download}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: 'var(--accent)', color: '#fff', letterSpacing: '0.02em' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.88'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download at {speed.toFixed(2)}x Speed
            </button>
            <p className="text-[10px] font-mono text-center mt-2" style={{ color: '#4b4b60' }}>
              Audio re-encoded via Web Audio API · Runs entirely in your browser
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
