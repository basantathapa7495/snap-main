import type { MetadataRoute } from 'next';

const SITE_URL = 'https://nepsom.xyz';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/explore', '/schools', '/schoolslist', '/solutions', '/s/'],
      disallow: [
        '/api/',
        '/auth/',
        '/pending',
        '/principal/',
        '/student/',
        '/teacher/',
        '/*?preview=1',
      ],
    },
    sitemap: SITE_URL + '/sitemap.xml',
    host: SITE_URL,
  };
}
