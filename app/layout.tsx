import AppNavWrapper from '@/components/AppNavWrapper';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://nepsom.xyz'),
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
  authors: [{ name: 'NEPSOM Nepal', url: 'https://nepsom.xyz' }],
  creator: 'NEPSOM Nepal',
  publisher: 'NEPSOM Nepal',
  category: 'Education Technology',
  alternates: {
    canonical: '/',
  },
  applicationName: 'NEPSOM',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon0.svg', type: 'image/svg+xml' },
      { url: '/icon1.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'NEPSOM',
    statusBarStyle: 'default',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    url: '/',
    title: 'NEPSOM — School Management Software for Nepal',
    description:
      'Your school’s own website + attendance, fees, exams & report cards. Built for Nepal. Works on any phone.',
    siteName: 'NEPSOM',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://nepsom.xyz/hero-image.png?og=20260925',
        width: 1536,
        height: 1024,
        alt: 'NEPSOM school management platform on mobile and desktop',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEPSOM — School Management Software for Nepal',
    description:
      'Your school’s own website + attendance, fees, exams & report cards. Built for Nepal.',
    images: [
      'https://nepsom.xyz/hero-image.png?og=20260925',
    ],
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://nepsom.xyz/#organization',
      name: 'NEPSOM',
      url: 'https://nepsom.xyz',
      logo: 'https://nepsom.xyz/web-app-manifest-512x512.png',
      description: 'School management software and school website platform built for schools in Nepal.',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'NEPSOM',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      url: 'https://nepsom.xyz',
      description: 'Manage attendance, fees, exams, report cards, notices, students and teachers from one platform.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'NPR',
      },
      provider: {
        '@id': 'https://nepsom.xyz/#organization',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <AppNavWrapper>{children}</AppNavWrapper>
      </body>
    </html>
  );
}
