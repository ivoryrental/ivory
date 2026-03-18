import { baseUrl } from "@/lib/metadata";

export function getLocalizedValue<T extends Record<string, unknown>>(
    record: T,
    field: string,
    locale: string
): string {
    const localizedKey = `${field}_${locale}`;
    const localizedValue = record[localizedKey];

    if (typeof localizedValue === "string" && localizedValue.trim()) {
        return localizedValue.trim();
    }

    const baseValue = record[field];
    return typeof baseValue === "string" ? baseValue.trim() : "";
}

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function trimText(value: string, maxLength: number): string {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) {
        return normalized;
    }

    return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

export function buildPreviewHtml({
    title,
    description,
    imageUrl,
    pageUrl,
    locale,
    imageType,
}: {
    title: string;
    description: string;
    imageUrl: string;
    pageUrl: string;
    locale: string;
    imageType: string;
}) {
    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    const safeImageUrl = escapeHtml(imageUrl);
    const safePageUrl = escapeHtml(pageUrl);

    return `<!doctype html>
<html lang="${escapeHtml(locale)}">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:url" content="${safePageUrl}" />
  <meta property="og:site_name" content="IVORY" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="${escapeHtml(locale === "ru" ? "ru_RU" : locale === "en" ? "en_US" : "ka_GE")}" />
  <meta property="og:image" content="${safeImageUrl}" />
  <meta property="og:image:secure_url" content="${safeImageUrl}" />
  <meta property="og:image:type" content="${escapeHtml(imageType)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${safeTitle}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  <meta name="twitter:image" content="${safeImageUrl}" />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="canonical" href="${safePageUrl}" />
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>${safeDescription}</p>
  <img src="${safeImageUrl}" alt="${safeTitle}" width="1200" height="630" />
</body>
</html>`;
}

export function previewResponse(html: string) {
    return new Response(html, {
        status: 200,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        },
    });
}

export { baseUrl };
