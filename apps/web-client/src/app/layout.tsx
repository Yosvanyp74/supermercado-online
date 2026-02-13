import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'SuperMercado Online - Compre tudo o que precisa',
    template: '%s | SuperMercado Online',
  },
  description:
    'Compre produtos frescos, mercearia e muito mais com entrega a domicílio em Venâncio Aires, RS.',
  keywords: ['supermercado online', 'entrega a domicílio', 'produtos frescos', 'Venâncio Aires'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
