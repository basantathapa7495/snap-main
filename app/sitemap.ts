import type { MetadataRoute } from 'next';

const SITE_URL = 'https://nepsom.xyz';

type SchoolRow = {
  slug: string | null;
};

async function getPublicSchoolSlugs(): Promise<string[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return [];

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/schools?select=slug&is_approved=eq.true&slug=not.is.null`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) return [];

    const schools = (await response.json()) as SchoolRow[];
    return schools
      .map((school) => school.slug?.trim())
      .filter((slug): slug is string => Boolean(slug));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/explore`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/schools`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/schoolslist`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/solutions`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  const schoolSlugs = await getPublicSchoolSlugs();
  const schoolPages: MetadataRoute.Sitemap = schoolSlugs.map((slug) => ({
    url: `${SITE_URL}/s/${encodeURIComponent(slug)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...schoolPages];
}
