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

    const service = await prisma.service.findFirst({
        where: {
            id,
            deletedAt: null,
        },
        select: {
            title: true,
            title_ka: true,
            title_ru: true,
            description: true,
            description_ka: true,
            description_ru: true,
        },
    });

    if (!service) {
        notFound();
    }

    const title = trimText(getLocalizedValue(service, "title", normalizedLocale), 120);
    const description = trimText(getLocalizedValue(service, "description", normalizedLocale), 200);
    const imageUrl = `${baseUrl}/api/og-image/service/${id}`;
    const pageUrl = `${baseUrl}/${normalizedLocale}/services/${id}`;

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
