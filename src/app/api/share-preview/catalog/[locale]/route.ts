import prisma from "@/lib/prisma";
import { baseUrl } from "@/lib/metadata";
import { buildPreviewHtml, getLocalizedValue, previewResponse, trimText } from "@/app/api/share-preview/shared";

const CATALOG_COPY: Record<string, { title: string; description: string; categoryDescription: (name: string) => string }> = {
    en: {
        title: "IVORY Catalog",
        description: "Browse IVORY inventory rental products for weddings and events.",
        categoryDescription: (name) => `Browse IVORY catalog filtered by ${name}.`,
    },
    ka: {
        title: "IVORY კატალოგი",
        description: "დაათვალიერეთ IVORY-ს ინვენტარი და პროდუქტები თქვენი ღონისძიებისთვის.",
        categoryDescription: (name) => `IVORY კატალოგი არჩეული კატეგორიით: ${name}.`,
    },
    ru: {
        title: "Каталог IVORY",
        description: "Просмотрите каталог инвентаря IVORY для свадеб и мероприятий.",
        categoryDescription: (name) => `Каталог IVORY с выбранной категорией: ${name}.`,
    },
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ locale: string }> }
) {
    const { locale } = await params;
    const normalizedLocale = ["en", "ka", "ru"].includes(locale) ? locale : "ka";
    const copy = CATALOG_COPY[normalizedLocale];
    const requestUrl = new URL(request.url);
    const categorySlug = requestUrl.searchParams.get("category");
    const search = requestUrl.searchParams.get("search");
    const page = requestUrl.searchParams.get("page");
    const pageParams = new URLSearchParams();

    if (categorySlug) pageParams.set("category", categorySlug);
    if (search) pageParams.set("search", search);
    if (page && page !== "1") pageParams.set("page", page);

    const pageUrl = `${baseUrl}/${normalizedLocale}/catalog${pageParams.toString() ? `?${pageParams.toString()}` : ""}`;

    if (categorySlug) {
        const category = await prisma.category.findFirst({
            where: {
                slug: categorySlug,
                deletedAt: null,
            },
            select: {
                name: true,
                name_ka: true,
                name_ru: true,
            },
        });

        if (category) {
            const localizedName = trimText(getLocalizedValue(category, "name", normalizedLocale), 120);
            const imageUrl = `${baseUrl}/api/og-image/category/${categorySlug}`;

            return previewResponse(
                buildPreviewHtml({
                    title: localizedName,
                    description: trimText(copy.categoryDescription(localizedName), 200),
                    imageUrl,
                    pageUrl,
                    locale: normalizedLocale,
                    imageType: "image/png",
                })
            );
        }
    }

    return previewResponse(
        buildPreviewHtml({
            title: trimText(copy.title, 120),
            description: trimText(copy.description, 200),
            imageUrl: `${baseUrl}/og-image-icoyes2.jpg`,
            pageUrl,
            locale: normalizedLocale,
            imageType: "image/jpeg",
        })
    );
}
