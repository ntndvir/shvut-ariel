import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({ subsets: ['hebrew', 'latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'זמני תפילות — שבות אריאל',
  description: 'זמני תפילות בית כנסת שבות אריאל',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={heebo.className}>{children}</body>
    </html>
  );
}
