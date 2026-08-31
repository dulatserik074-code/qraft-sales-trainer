import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ServiceWorkerRegister } from './service-worker-register';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Qraft Sales Trainer — ИИ-тренажёр продаж',
  description: 'Адаптивный тренажёр переговоров с ИИ-покупателем, оценкой навыков и персональными скриптами.',
  applicationName: 'Qraft Sales Trainer',
  manifest: '/manifest.webmanifest',
};
export const viewport = {width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#071b33'};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
