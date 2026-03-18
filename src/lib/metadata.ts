import { Metadata } from 'next';
import { transformImageLink } from "@/lib/utils";

const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ivory.ge';
export const baseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

const ogLocales: Record<string, string> = {
    ka: 'ka_GE',
    en: 'en_US',
    ru: 'ru_RU'
};

const shareImageUrl = `${baseUrl}/og-image-icoyes2.jpg`;

interface MetadataOptions {
    title?: string;
    description?: string;
    imageUrl?: string;
    imageAlt?: string;
}

function normalizeMetadataText(value?: string, maxLength: number = 200): string | undefined {
    if (!value) return undefined;

    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) return undefined;

    return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trimEnd()}…` : normalized;
}

export function getSocialImageUrl(imageUrl?: string): string {
    if (!imageUrl) {
        return shareImageUrl;
    }

    const transformed = transformImageLink(imageUrl);
    if (!transformed || transformed === "INVALID_FOLDER_LINK") {
        return shareImageUrl;
    }

    if (/^https?:\/\//i.test(transformed)) {
        return transformed;
    }

    return transformed.startsWith("/") ? `${baseUrl}${transformed}` : `${baseUrl}/${transformed}`;
}

export function getRenderedSocialImageUrl(imageUrl?: string): string {
    if (!imageUrl) {
        return shareImageUrl;
    }

    return `${baseUrl}/api/og-image?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Generates base metadata including canonicals and hreflangs for a given locale and path.
 * link: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#alternates
 * 
 * @param locale The current locale (en, ka, ru)
 * @param path The path WITHOUT the locale prefix (e.g., '/about', '/catalog/123')
 */
export function getBaseMetadata(locale: string, path: string = '', options: MetadataOptions = {}): Metadata {
    // Normalize path: handle root case and ensure it starts with /
    const normalizedPath = path === '/' ? '' : (path.startsWith('/') ? path : `/${path}`);
    const title = normalizeMetadataText(options.title, 120);
    const description = normalizeMetadataText(options.description, 200);
    const imageUrl = getSocialImageUrl(options.imageUrl);
    const imageAlt = normalizeMetadataText(options.imageAlt, 120) || 'IVORY share preview';

    return {
        metadataBase: new URL(baseUrl),
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
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
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: imageAlt,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            images: [imageUrl],
        },
    };
}
