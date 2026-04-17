import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Audio Speed Changer - Export as MP3 without Pitch Change",
  description: "Change audio playback speed (0.25x to 4x) without altering the pitch. Everything runs client-side in your browser. Export to MP3 or WAV for free.",
  keywords: ["audio speed changer", "change audio speed", "slow down audio", "speed up audio", "retain pitch", "MP3 export", "free tool"],
  openGraph: {
    title: "Audio Speed Changer - Change Speed, Not Pitch",
    description: "Change audio playback speed without altering the pitch. Runs entirely in your browser with MP3 support.",
  }
};

export default function AudioSpeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
