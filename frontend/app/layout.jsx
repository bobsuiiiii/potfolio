import './globals.css';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { site } from '@/lib/site';

const sans = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: site.title,
  description: site.description,
  openGraph: { title: site.title, description: site.description, type: 'website' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
