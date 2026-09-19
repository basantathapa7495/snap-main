import AppNavWrapper from '@/components/AppNavWrapper';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'NEPSOM — School Management Software for Nepal',
    template: '%s | NEPSOM',
  },
  description:
    'NEPSOM gives every school in Nepal its own website, plus attendance, fee tracking, exams and report cards. Free to start. Works on any phone, even on slow internet.',
  keywords: [
    'school management software Nepal',
    'school ERP Nepal',
    'school attendance system Nepal',
    'school fee management software Nepal',
    'report card software Nepal',
    'school website Nepal',
  ],
  authors: [{ name: 'NEPSOM Nepal' }],
  appleWebApp: {
    title: 'Nepsom',
  },
  openGraph: {
    title: 'NEPSOM — School Management Software for Nepal',
    description:
      'Your school’s own website + attendance, fees, exams & report cards. Built for Nepal. Works on any phone.',
    siteName: 'NEPSOM',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 800,
        alt: 'Students raising hands in a classroom',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEPSOM — School Management Software for Nepal',
    description:
      'Your school’s own website + attendance, fees, exams & report cards. Built for Nepal.',
    images: [
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppNavWrapper>{children}</AppNavWrapper>
      </body>
    </html>
  );
}
