import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paper Animator - Newspaper-Style Keyword Highlight Frames',
  description:
    'Generate newspaper-style keyword highlight animation frames. Use AI to create frame content, pick paper textures, and export PNG images for reels, stories, and carousels.',
  keywords: [
    'newspaper animation',
    'keyword highlight frames',
    'paper animator',
    'instagram reels',
    'news style frames',
    'content creator tool',
    'AI content generator',
  ],
  openGraph: {
    title: 'Paper Animator - Newspaper Keyword Highlight Frames',
    description:
      'Generate newspaper-style keyword highlight frames for social media. Pick textures, use AI for content, download PNGs.',
  },
};

export default function PaperAnimatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
