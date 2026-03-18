import { getSocialImageUrl } from "@/lib/metadata";
import { buildPreviewHtml, previewResponse, trimText, baseUrl } from "@/app/api/share-preview/shared";

const HOME_COPY: Record<string, { title: string; description: string }> = {
    en: {
        title: "IVORY — Inventory Rental",
        description: "Luxury inventory rental for weddings and events. Decor, furniture like no other.",
    },
    ka: {
        title: "IVORY — ინვენტარის გაქირავება",
        description: "ინვენტარისა და დეკორაციების გაქირავება თქვენი მნიშვნელოვანი დღეებისთვის.",
    },
    ru: {
        title: "IVORY — Аренда инвентаря",
        description: "Аренда инвентаря и декора для ваших особенных дней.",
    },
};

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ locale: string }> }
) {
    const { locale } = await params;
    const normalizedLocale = ["en", "ka", "ru"].includes(locale) ? locale : "ka";
    const copy = HOME_COPY[normalizedLocale];
    const imageUrl = getSocialImageUrl();
    const pageUrl = normalizedLocale === "ka" ? `${baseUrl}/ka` : `${baseUrl}/${normalizedLocale}`;

    return previewResponse(
        buildPreviewHtml({
            title: trimText(copy.title, 120),
            description: trimText(copy.description, 200),
            imageUrl,
            pageUrl,
            locale: normalizedLocale,
            imageType: "image/jpeg",
        })
    );
}
