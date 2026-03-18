import { Metadata } from 'next';

const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ivory.ge';
export const baseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

const ogLocales: Record<string, string> = {
    ka: 'ka_GE',
    en: 'en_US',
    ru: 'ru_RU'
};

const shareImageUrl = `${baseUrl}/og-image-icoyes2.jpg`;

/**
 * Generates base metadata including canonicals and hreflangs for a given locale and path.
 * link: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#alternates
 * 
 * @param locale The current locale (en, ka, ru)
 * @param path The path WITHOUT the locale prefix (e.g., '/about', '/catalog/123')
 */
export function getBaseMetadata(locale: string, path: string = ''): Metadata {
    // Normalize path: handle root case and ensure it starts with /
    const normalizedPath = path === '/' ? '' : (path.startsWith('/') ? path : `/${path}`);

    return {
        metadataBase: new URL(baseUrl),
        alternates: {
            canonical: `/${locale}${normalizedPath}`,
            languages: {
                en: `/en${normalizedPath}`,
                ka: `/ka${normalizedPath}`,
                ru: `/ru${normalizedPath}`,
                'x-default': `/ka${normalizedPath}`
            }
        },
        openGraph: {
            url: `${baseUrl}/${locale}${normalizedPath}`,
            locale: ogLocales[locale] || 'ka_GE',
            siteName: 'IVORY',
            type: 'website',
            images: [
                {
                    url: shareImageUrl,
                    width: 1200,
                    height: 630,
                    alt: 'IVORY share preview',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            images: [shareImageUrl],
        },
    };
}
