import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = 'https://nepsom.xyz';

type SchoolSeo = {
  name: string;
  slug: string;
  short_description: string | null;
  about_text: string | null;
  school_type: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_approved: boolean | null;
};

async function getSchool(slug: string): Promise<SchoolSeo | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const query = new URLSearchParams({
    select: 'name,slug,short_description,about_text,school_type,address,phone,email,logo_url,banner_url,is_approved',
    slug: `eq.${slug}`,
    limit: '1',
  });

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/schools?${query.toString()}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;

    const schools = (await response.json()) as SchoolSeo[];
    return schools[0] ?? null;
  } catch {
    return null;
  }
}

function descriptionFor(school: SchoolSeo) {
  return (
    school.short_description?.trim() ||
    school.about_text?.trim().slice(0, 155) ||
    `Visit the official website of ${school.name}. View school information, notices, activities and online admission details.`
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const school = await getSchool(slug);
  const canonical = `${SITE_URL}/s/${encodeURIComponent(slug)}`;

  if (!school) {
    return {
      title: { absolute: 'School Website | NEPSOM' },
      robots: { index: false, follow: false },
    };
  }

  const description = descriptionFor(school);
  const socialImage = school.banner_url || school.logo_url || '/web-app-manifest-512x512.png';
  const canIndex = school.is_approved !== false;

  return {
    title: { absolute: `${school.name} | Official School Website` },
    description,
    alternates: { canonical },
    robots: {
      index: canIndex,
      follow: canIndex,
      googleBot: {
        index: canIndex,
        follow: canIndex,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: school.name,
      title: `${school.name} | Official School Website`,
      description,
      images: [{ url: socialImage, alt: school.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${school.name} | Official School Website`,
      description,
      images: [socialImage],
    },
  };
}

export default async function SchoolWebsiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const school = await getSchool(slug);

  if (!school || school.is_approved === false) return children;

  const url = `${SITE_URL}/s/${encodeURIComponent(school.slug)}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: school.name,
    url,
    description: descriptionFor(school),
    ...(school.school_type ? { educationalCredentialAwarded: school.school_type } : {}),
    ...(school.address ? { address: school.address } : {}),
    ...(school.phone ? { telephone: school.phone } : {}),
    ...(school.email ? { email: school.email } : {}),
    ...(school.logo_url ? { logo: school.logo_url } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      {children}
    </>
  );
}
