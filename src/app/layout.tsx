import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Sankalp's Tools",
    default: "Sankalp's Tools — Free Developer & Media Utilities",
  },
  description: "A premium suite of free, client-side, browser-based tools perfectly designed for developers and creators. No installs, no server uploads, total privacy.",
  keywords: ["free tools", "online utilities", "audio speed changer", "developer tools", "Sankalp's tools", "browser based"],
  authors: [{ name: "Sankalp" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tools.sankalp.com", // Replace with your domain
    siteName: "Sankalp's Tools",
    title: "Sankalp's Tools — Free Developer & Media Utilities",
    description: "A premium suite of free, client-side, browser-based tools perfectly designed for developers and creators.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sankalp's Tools — Free Developer & Media Utilities",
    description: "A premium suite of free, client-side, browser-based tools perfectly designed for developers and creators.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
