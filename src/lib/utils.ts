import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Global helper to get localized content (e.g. title_ka, title_ru, or default title)
export function getLocalized(
  obj: object | null | undefined,
  field: string,
  locale: string
): string {
  if (!obj) return "";
  const record = obj as Record<string, unknown>;
  const baseValue = record[field];

  // If English (default), return base field
  if (locale === 'en') return typeof baseValue === "string" ? baseValue : "";

  // Try specific locale field (e.g. title_ka)
  const localizedValue = record[`${field}_${locale}`];

  // Return localized value if exists, otherwise fallback to English/base field
  if (typeof localizedValue === "string" && localizedValue) return localizedValue;
  return typeof baseValue === "string" ? baseValue : "";
}

// Helper to transform Google Drive URLs for direct image access
export function transformImageLink(url: string): string {
    const normalizedUrl = normalizeImageLink(url);
    if (!normalizedUrl) return normalizedUrl;

    if (normalizedUrl === "INVALID_FOLDER_LINK") {
        return "INVALID_FOLDER_LINK";
    }

    if (/^https?:\/\//i.test(normalizedUrl)) {
        return `/api/image?url=${encodeURIComponent(normalizedUrl)}`;
    }

    return normalizedUrl;
}

export function normalizeImageLink(url: string): string {
    if (!url) return url;
    const normalizedUrl = url.trim();
    if (!normalizedUrl) return normalizedUrl;

    // Reject Drive folder links (this app expects a direct image link)
    if (/drive\.google\.com\/drive\/folders\/[^/?]+/.test(normalizedUrl)) {
        return "INVALID_FOLDER_LINK";
    }

    // Normalize Google Drive links to a stable thumbnail endpoint.
    // This avoids browser-side MIME issues and hotlink inconsistencies.
    const idPatterns = [
        /drive\.google\.com\/file\/d\/([^/?]+)/,
        /drive\.google\.com\/open\?(?:[^#]*&)?id=([^&]+)/,
        /drive\.google\.com\/uc\?(?:[^#]*&)?id=([^&]+)/,
        /drive\.google\.com\/thumbnail\?(?:[^#]*&)?id=([^&]+)/,
        /drive\.usercontent\.google\.com\/download\?(?:[^#]*&)?id=([^&]+)/,
        /lh3\.googleusercontent\.com\/d\/([^/?=]+)/,
    ];

    for (const pattern of idPatterns) {
        const match = normalizedUrl.match(pattern);
        if (match?.[1]) {
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w2000`;
        }
    }

    return normalizedUrl;
}

// Safe JSON parse with fallback
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
    try {
        return JSON.parse(jsonString) as T;
    } catch {
        return fallback;
    }
}

// Format price with Georgian Lari currency
export function formatPrice(price: number): string {
    return `\u20BE${price.toFixed(2)}`;
}
