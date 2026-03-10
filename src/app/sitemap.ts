import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma'; // Ensure this path is correct based on project structure

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ivory.ge';
    const baseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

    // Static pages
    const routes = [
        '',
        '/about',
        '/services',
        '/catalog',
        '/contact',
        '/privacy',
        '/terms',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic Product pages
    // Fetch only IDs to be lightweight
    const products = await prisma.product.findMany({
        where: { deletedAt: null },
        select: { id: true, updatedAt: true },
    });

    const productRoutes = products.map((product) => ({
        url: `${baseUrl}/catalog/${product.id}`,
        lastModified: product.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.7,
    }));

    // Localized routes ONLY
    const locales = ['en', 'ka', 'ru'];
    const localizedRoutes = [];

    for (const locale of locales) {
        for (const route of routes) {
            localizedRoutes.push({
                ...route,
                url: `${baseUrl}/${locale}${route.url.replace(baseUrl, '')}`,
            });
        }
        for (const route of productRoutes) {
            localizedRoutes.push({
                ...route,
                url: `${baseUrl}/${locale}${route.url.replace(baseUrl, '')}`,
            });
        }
    }

    return localizedRoutes;
}
