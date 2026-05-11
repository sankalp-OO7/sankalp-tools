import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carousel Creator — ShamsGS Tools',
  description: 'Create branded 1080×1080 carousels for shamsgs.com. Generate JSON with AI and download slide-by-slide PNGs.',
};

export default function CarouselLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
