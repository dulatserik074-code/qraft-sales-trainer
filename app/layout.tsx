import type { Metadata } from 'next';
import { ServiceWorkerRegister } from './service-worker-register';
import './globals.css';

export const metadata: Metadata = {
  title: 'Qraft Sales Trainer — ИИ-тренажёр продаж',
  description:
    'Адаптивный тренажёр переговоров с ИИ-покупателем, оценкой навыков и персональными скриптами.',
  applicationName: 'Qraft Sales Trainer',
  authors: [
    { name: 'Dulat Serik', url: 'https://github.com/dulatserik074-code' },
  ],
  creator: 'Dulat Serik',
  keywords: [
    'ИИ-тренажёр продаж',
    'B2B sales training',
    'AI coach',
    'переговоры',
  ],
  robots: { index: true, follow: true },
  manifest: '/manifest.webmanifest',
};
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#071b33',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
