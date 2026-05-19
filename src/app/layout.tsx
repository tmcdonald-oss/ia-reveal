import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IA Reveal',
  description: 'Inclusive Access code delivery and reveal tracking',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
