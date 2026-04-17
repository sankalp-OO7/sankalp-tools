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
const MP3_BITRATES = [128, 192, 256, 320];

// Encode to WAV fallback
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
  const ab = new ArrayBuffer(44 + dataSize);
  const v = new DataView(ab);
  const ws = (off: number, str: string) => { for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true);
  ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, numCh, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, byteRate, true);
  v.setUint16(32, blockAlign, true); v.setUint16(34, 16, true);
  ws(36, 'data'); v.setUint32(40, dataSize, true);
  let off = 44;
  for (let i = 0; i < wavData.length; i++) {
    const s = Math.max(-1, Math.min(1, wavData[i]));
    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    off += 2;
  }
  return ab;
}

// Encode AudioBuffer → MP3 Blob using lamejs (loaded dynamically)
async function encodeToMp3(
  buffer: AudioBuffer,
  bitrate: number,
  onProgress: (p: number) => void
): Promise<Blob> {
  // dynamic import — lamejs has no ESM build, load via require
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lamejs = await import('@breezystack/lamejs') as any;
  const Mp3Encoder = lamejs.default?.Mp3Encoder ?? lamejs.Mp3Encoder;

  const numCh = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const encoder = new Mp3Encoder(numCh === 1 ? 1 : 2, sampleRate, bitrate);

  const LEFT = buffer.getChannelData(0);
  const RIGHT = numCh > 1 ? buffer.getChannelData(1) : LEFT;
  const CHUNK = 1152; // lamejs block size
  const mp3Chunks: ArrayBuffer[] = [];
  const total = LEFT.length;

  // Convert float32 (-1..1) to int16
  const toInt16 = (f: Float32Array, start: number, len: number): Int16Array => {
    const out = new Int16Array(len);
    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, f[start + i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return out;
  };

  for (let i = 0; i < total; i += CHUNK) {
    const len = Math.min(CHUNK, total - i);
    const L = toInt16(LEFT, i, len);
    const R = numCh > 1 ? toInt16(RIGHT, i, len) : L;
    const mp3buf: Int8Array = numCh === 1 ? encoder.encodeBuffer(L) : encoder.encodeBuffer(L, R);
    if (mp3buf.length > 0) mp3Chunks.push(mp3buf.buffer.slice(mp3buf.byteOffset, mp3buf.byteOffset + mp3buf.byteLength) as ArrayBuffer);
    onProgress(Math.round((i / total) * 85) + 10);
    // yield to UI every 50 chunks
    if (i % (CHUNK * 50) === 0) await new Promise(r => setTimeout(r, 0));
  }

  const end: Int8Array = encoder.flush();
  if (end.length > 0) mp3Chunks.push(end.buffer.slice(end.byteOffset, end.byteOffset + end.byteLength) as ArrayBuffer);
  onProgress(98);

  return new Blob(mp3Chunks, { type: 'audio/mpeg' });
}

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
  const [bitrate, setBitrate] = useState(320);
  const [format, setFormat] = useState<'mp3' | 'wav'>('mp3');

  const audioElRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const currentFileRef = useRef<File | null>(null);

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
    setProgress(0);
    setTimeDisplay('0:00 / 0:00');

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
        audioBufferRef.current = await audioCtxRef.current.decodeAudioData(
          (e.target!.result as ArrayBuffer).slice(0)
        );
      } catch (err) {
        console.warn('Buffer decode failed:', err);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [speed]);

  // Audio element event wiring
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
    const onEnded = () => { setIsPlaying(false); setProgress(0); setTimeDisplay(`0:00 / ${fmt(origDuration)}`); };
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
  }, [origDuration]);

  const togglePlay = () => {
    const audio = audioElRef.current;
    if (!audio?.src) return;
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    if (audio.paused) { audio.playbackRate = speed; audio.play(); }
    else audio.pause();
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioElRef.current;
    if (!audio?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  };

  const download = async () => {
    if (!audioBufferRef.current) { alert('Audio not ready yet — wait a moment.'); return; }
    audioElRef.current?.pause();
    setProcessing(true); setProcPct(0); setProcStatus('Preparing offline render...');
    try {
      // 1. Render at new speed via OfflineAudioContext
      const buf = audioBufferRef.current;
      const newLength = Math.ceil(buf.length / speed);
      setProcPct(5); setProcStatus('Rendering audio at ' + speed.toFixed(2) + 'x speed...');
      await new Promise(r => setTimeout(r, 30));

      const offCtx = new OfflineAudioContext(buf.numberOfChannels, newLength, buf.sampleRate);
      const src = offCtx.createBufferSource();
      src.buffer = buf; src.playbackRate.value = speed;
      src.connect(offCtx.destination); src.start(0);

      const rendered = await offCtx.startRendering();
      setProcPct(9); setProcStatus(format === 'mp3' ? 'Encoding MP3...' : 'Encoding WAV...');
      await new Promise(r => setTimeout(r, 30));

      let blob: Blob;
      const baseName = (currentFileRef.current?.name.replace(/\.[^.]+$/, '') ?? 'audio');

      if (format === 'mp3') {
        blob = await encodeToMp3(rendered, bitrate, (p) => {
          setProcPct(p);
          setProcStatus(`Encoding MP3 at ${bitrate}kbps... ${p}%`);
        });
      } else {
        const wav = audioBufferToWav(rendered);
        blob = new Blob([wav], { type: 'audio/wav' });
        setProcPct(98);
      }

      setProcPct(100); setProcStatus('Done! Downloading...');
      await new Promise(r => setTimeout(r, 300));

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}_${speed.toFixed(2)}x.${format}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err: unknown) {
      console.error(err);
      alert('Export failed: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <audio ref={audioElRef} style={{ display: 'none' }} />

      {/* Processing overlay */}
      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
          <div className="p-8 rounded-2xl text-center w-80"
            style={{ background: 'var(--card)', border: '1px solid #2a2a40', boxShadow: '0 0 60px #7c6af720' }}>
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" className="w-6 h-6 animate-spin">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <div className="text-base font-semibold mb-1" style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }}>
              {format === 'mp3' ? 'Encoding MP3' : 'Encoding WAV'}
            </div>
            <div className="text-xs font-mono mb-5" style={{ color: '#6b6b80' }}>{procStatus}</div>
            <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: '#1e1e2e' }}>
              <div className="h-full rounded-full transition-all duration-200"
                style={{ width: `${procPct}%`, background: 'linear-gradient(90deg, #7c6af7, #a78bfa)' }} />
            </div>
            <div className="text-sm font-mono font-semibold" style={{ color: 'var(--accent)' }}>{procPct}%</div>
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
          <p className="text-sm font-mono" style={{ color: '#6b6b80' }}>{'// upload → adjust → preview → export MP3'}</p>
        </div>

        {/* Upload zone */}
        <div
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
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className="text-sm font-semibold mb-1" style={{ color: '#e8e8f0' }}>Drop audio file here</div>
          <div className="text-xs font-mono" style={{ color: '#6b6b80' }}>MP3, WAV, M4A, OGG, FLAC supported</div>
        </div>

        {/* File info bar */}
        {fileName && (
          <div className="flex items-center gap-3 p-3 rounded-xl mb-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" className="w-[18px] h-[18px]">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: '#e8e8f0' }}>{fileName}</div>
              <div className="text-xs font-mono" style={{ color: '#6b6b80' }}>
                {origDuration > 0 ? `${fmtFull(origDuration)} · ` : ''}{fileSize}
              </div>
            </div>
            {fileReady && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-full"
                style={{ background: 'rgba(61,232,160,0.1)', border: '1px solid #1a6645', color: '#3de8a0' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Ready
              </div>
            )}
          </div>
        )}

        {/* Controls card */}
        <div className="rounded-2xl p-6 space-y-6 transition-opacity duration-300"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            opacity: fileReady ? 1 : 0.35,
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
                {[{ label: '+', delta: 0.01 }, { label: '−', delta: -0.01 }].map(({ label, delta }) => (
                  <button key={label} onClick={() => setSpeed(speed + delta)}
                    className="w-11 h-11 rounded-xl font-mono text-xl flex items-center justify-center transition-all active:scale-95"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border-bright)', color: 'var(--text)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-bright)'}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Slider */}
            <div className="mt-4">
              <input type="range" min="0.25" max="4.00" step="0.01" value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="w-full cursor-pointer"
                style={{ accentColor: 'var(--accent)' }} />
              <div className="flex justify-between text-[10px] font-mono mt-1" style={{ color: '#4b4b60' }}>
                <span>0.25x</span><span>1x</span><span>2x</span><span>3x</span><span>4x</span>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#6b6b80' }}>Quick Presets</div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button key={p} onClick={() => setSpeed(p)}
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
                    value: diffState === 'same' ? '±0s' : (diffState === 'shorter' ? '−' : '+') + fmtFull(Math.abs(diff)),
                    color: diffState === 'same' ? '#6b6b80' : diffState === 'shorter' ? '#3de8a0' : '#f76a6a',
                  },
                ].map(d => (
                  <div key={d.label} className="rounded-xl p-3 text-center"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="text-[9px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#4b4b60' }}>{d.label}</div>
                    <div className="text-base font-mono font-medium" style={{ color: d.color }}>{d.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Player */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#6b6b80' }}>Preview Player</div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {/* Speed live badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono" style={{ color: '#4b4b60' }}>
                  Playing at <span style={{ color: 'var(--accent)' }}>{speed.toFixed(2)}x</span>
                </span>
                <span className="text-[10px] font-mono" style={{ color: '#4b4b60' }}>{timeDisplay}</span>
              </div>
              {/* Progress bar (clickable) */}
              <div className="mb-3 cursor-pointer group" onClick={seekTo}>
                <div className="h-1.5 rounded-full overflow-hidden relative" style={{ background: 'var(--border-bright)' }}>
                  <div className="h-full rounded-full transition-none"
                    style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c6af7, #a78bfa)' }} />
                </div>
              </div>
              {/* Controls row */}
              <div className="flex items-center gap-3">
                {/* Rewind 10s */}
                <button onClick={() => { if (audioElRef.current) audioElRef.current.currentTime = Math.max(0, audioElRef.current.currentTime - 10); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: 'transparent', color: '#6b6b80', border: '1px solid #1e1e2e' }}
                  title="−10s"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#3d3580'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#1e1e2e'}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.79"/>
                  </svg>
                </button>
                {/* Play/Pause */}
                <button onClick={togglePlay}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c6af7, #a78bfa)', boxShadow: '0 0 20px #7c6af740' }}>
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  )}
                </button>
                {/* Forward 10s */}
                <button onClick={() => { if (audioElRef.current) audioElRef.current.currentTime = Math.min(audioElRef.current.duration || 0, audioElRef.current.currentTime + 10); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: 'transparent', color: '#6b6b80', border: '1px solid #1e1e2e' }}
                  title="+10s"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#3d3580'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#1e1e2e'}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-3.79"/>
                  </svg>
                </button>
                <div className="flex-1" />
                {/* Speed dec/inc quick */}
                <button onClick={() => setSpeed(speed - 0.25)}
                  className="text-[10px] font-mono px-2 py-1 rounded-lg transition-all"
                  style={{ background: 'var(--border)', color: '#6b6b80', border: '1px solid #2a2a40' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#a78bfa'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6b6b80'}>
                  −0.25x
                </button>
                <button onClick={() => setSpeed(speed + 0.25)}
                  className="text-[10px] font-mono px-2 py-1 rounded-lg transition-all"
                  style={{ background: 'var(--border)', color: '#6b6b80', border: '1px solid #2a2a40' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#a78bfa'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6b6b80'}>
                  +0.25x
                </button>
              </div>
            </div>
          </div>

          {/* Export section */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#6b6b80' }}>Export</div>
            <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {/* Format selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: '#6b6b80' }}>Format:</span>
                <div className="flex gap-1">
                  {(['mp3', 'wav'] as const).map(f => (
                    <button key={f} onClick={() => setFormat(f)}
                      className="text-xs font-mono px-3 py-1 rounded-lg transition-all uppercase"
                      style={{
                        background: format === f ? 'var(--accent-glow)' : 'transparent',
                        border: `1px solid ${format === f ? 'var(--accent-dim)' : '#2a2a40'}`,
                        color: format === f ? 'var(--accent)' : '#6b6b80',
                      }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* MP3 bitrate selector */}
              {format === 'mp3' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono" style={{ color: '#6b6b80' }}>Bitrate:</span>
                  {MP3_BITRATES.map(b => (
                    <button key={b} onClick={() => setBitrate(b)}
                      className="text-xs font-mono px-2.5 py-1 rounded-lg transition-all"
                      style={{
                        background: bitrate === b ? 'var(--accent-glow)' : 'transparent',
                        border: `1px solid ${bitrate === b ? 'var(--accent-dim)' : '#2a2a40'}`,
                        color: bitrate === b ? 'var(--accent)' : '#6b6b80',
                      }}>
                      {b}k{b === 320 && <span style={{ color: 'inherit', opacity: 0.6 }}> best</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Download button */}
              <button onClick={download}
                className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #7c6af7, #a78bfa)', color: '#fff', letterSpacing: '0.02em', boxShadow: '0 4px 20px #7c6af730' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.9'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export as {format.toUpperCase()}
                {format === 'mp3' && ` · ${bitrate}kbps`}
                {` · ${speed.toFixed(2)}x`}
              </button>
              <p className="text-[10px] font-mono text-center" style={{ color: '#4b4b60' }}>
                {format === 'mp3'
                  ? 'MP3 encoded via lamejs · Runs 100% in your browser · No uploads'
                  : 'Uncompressed WAV via Web Audio API · Runs in your browser'}
              </p>
            </div>
          </div>
        </div>

        {!fileReady && !fileName && (
          <p className="text-center text-xs font-mono mt-4" style={{ color: '#4b4b60' }}>
            ↑ Drop an audio file to get started
          </p>
        )}
      </div>
    </>
  );
}
