import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RAMFORGE Command | AI Workforce',
  description: 'An independent command centre for five divisions and 75 AI workforce roles.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#080d18' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
