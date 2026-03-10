import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/en/admin/', '/ka/admin/', '/ru/admin/'],
        },
        sitemap: `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://ivory.ge').replace(/\/$/, '')}/sitemap.xml`,
    };
}
