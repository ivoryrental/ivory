import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { baseUrl } from "@/lib/metadata";
import { buildPreviewHtml, getLocalizedValue, previewResponse, trimText } from "@/app/api/share-preview/shared";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ locale: string; id: string }> }
) {
    const { locale, id } = await params;
    const normalizedLocale = ["en", "ka", "ru"].includes(locale) ? locale : "ka";

    const product = await prisma.product.findFirst({
        where: {
            id,
            deletedAt: null,
        },
        select: {
            name: true,
            name_ka: true,
            name_ru: true,
            description: true,
            description_ka: true,
            description_ru: true,
        },
    });

    if (!product) {
        notFound();
    }

    const title = trimText(getLocalizedValue(product, "name", normalizedLocale), 120);
    const description = trimText(getLocalizedValue(product, "description", normalizedLocale), 200);
    const imageUrl = `${baseUrl}/api/og-image/product/${id}`;
    const pageUrl = `${baseUrl}/${normalizedLocale}/catalog/${id}`;

    return previewResponse(
        buildPreviewHtml({
            title,
            description,
            imageUrl,
            pageUrl,
            locale: normalizedLocale,
            imageType: "image/png",
        })
    );
}
