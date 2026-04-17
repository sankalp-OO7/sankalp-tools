import type { Metadata } from 'next';
import DashboardShell from '@/components/DashboardShell';

export const metadata: Metadata = {
  title: "Sankalp's Tools",
  description: "A curated collection of browser-based tools — no installs, no data sent to servers.",
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
