import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { baseUrl, defaultShareImageUrl } from "@/lib/metadata";
import { buildPreviewHtml, getLocalizedValue, previewResponse, trimText } from "@/app/api/share-preview/shared";

const LOCALIZED_ROOT_PATTERN = /^\/(en|ka|ru)$/;
const LOCALIZED_STATIC_PATTERN = /^\/(en|ka|ru)\/(about|contact|catalog|services|privacy|terms)$/;
const LOCALIZED_PRODUCT_PATTERN = /^\/(en|ka|ru)\/catalog\/([^/]+)$/;
const LOCALIZED_SERVICE_PATTERN = /^\/(en|ka|ru)\/services\/([^/]+)$/;

const STATIC_COPY: Record<string, Record<string, { title: string; description: string }>> = {
    en: {
        home: {
            title: "IVORY — Inventory Rental",
            description: "Luxury inventory rental for weddings and events. Decor, furniture like no other.",
        },
        about: {
            title: "About IVORY",
            description: "Learn more about IVORY and our inventory rental service for weddings and events.",
        },
        contact: {
            title: "Contact IVORY",
            description: "Get in touch with IVORY for inventory rental, decor, and event inquiries.",
        },
        catalog: {
            title: "IVORY Catalog",
            description: "Browse IVORY inventory rental products for weddings and events.",
        },
        services: {
            title: "IVORY Services",
            description: "Explore IVORY event services, decor, and design solutions.",
        },
        privacy: {
            title: "IVORY Privacy Policy",
            description: "Read the IVORY privacy policy.",
        },
        terms: {
            title: "IVORY Terms & Conditions",
            description: "Read the IVORY terms and conditions.",
        },
    },
    ka: {
        home: {
            title: "IVORY — ინვენტარის გაქირავება",
            description: "ინვენტარისა და დეკორაციების გაქირავება თქვენი მნიშვნელოვანი დღეებისთვის.",
        },
        about: {
            title: "IVORY — ჩვენს შესახებ",
            description: "გაიგეთ მეტი IVORY-სა და ჩვენი ინვენტარის გაქირავების სერვისის შესახებ.",
        },
        contact: {
            title: "IVORY — კონტაქტი",
            description: "დაგვიკავშირდით ინვენტარის, დეკორისა და ღონისძიების სერვისებისთვის.",
        },
        catalog: {
            title: "IVORY კატალოგი",
            description: "დაათვალიერეთ IVORY-ს ინვენტარი და პროდუქტები თქვენი ღონისძიებისთვის.",
        },
        services: {
            title: "IVORY სერვისები",
            description: "იხილეთ IVORY-ს სერვისები, დეკორი და დიზაინის გადაწყვეტილებები.",
        },
        privacy: {
            title: "IVORY — კონფიდენციალურობა",
            description: "გაეცანით IVORY-ს კონფიდენციალურობის პოლიტიკას.",
        },
        terms: {
            title: "IVORY — წესები და პირობები",
            description: "გაეცანით IVORY-ს წესებსა და პირობებს.",
        },
    },
    ru: {
        home: {
            title: "IVORY — Аренда инвентаря",
            description: "Аренда инвентаря и декора для свадеб и мероприятий.",
        },
        about: {
            title: "О IVORY",
            description: "Узнайте больше о IVORY и нашем сервисе аренды инвентаря.",
        },
        contact: {
            title: "Контакты IVORY",
            description: "Свяжитесь с IVORY по вопросам аренды инвентаря, декора и мероприятий.",
        },
        catalog: {
            title: "Каталог IVORY",
            description: "Просмотрите каталог инвентаря IVORY для свадеб и мероприятий.",
        },
        services: {
            title: "Услуги IVORY",
            description: "Изучите услуги IVORY, декор и дизайнерские решения для мероприятий.",
        },
        privacy: {
            title: "IVORY — Конфиденциальность",
            description: "Ознакомьтесь с политикой конфиденциальности IVORY.",
        },
        terms: {
            title: "IVORY — Условия использования",
            description: "Ознакомьтесь с правилами и условиями IVORY.",
        },
    },
};

function buildPageUrl(pathname: string, searchParams: URLSearchParams) {
    const pageParams = new URLSearchParams(searchParams);
    pageParams.delete("previewPath");
    const query = pageParams.toString();
    return `${baseUrl}${pathname}${query ? `?${query}` : ""}`;
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const previewPath = requestUrl.searchParams.get("previewPath") || "/";
    const searchParams = new URLSearchParams(requestUrl.searchParams);
    const pageUrl = buildPageUrl(previewPath, searchParams);

    if (previewPath === "/") {
        const copy = STATIC_COPY.ka.home;
        return previewResponse(
            buildPreviewHtml({
                title: copy.title,
                description: copy.description,
                imageUrl: defaultShareImageUrl,
                pageUrl: `${baseUrl}/`,
                locale: "ka",
                imageType: "image/jpeg",
            })
        );
    }

    const localizedRootMatch = previewPath.match(LOCALIZED_ROOT_PATTERN);
    if (localizedRootMatch) {
        const [, locale] = localizedRootMatch;
        const copy = STATIC_COPY[locale].home;
        return previewResponse(
            buildPreviewHtml({
                title: copy.title,
                description: copy.description,
                imageUrl: defaultShareImageUrl,
                pageUrl,
                locale,
                imageType: "image/jpeg",
            })
        );
    }

    const localizedStaticMatch = previewPath.match(LOCALIZED_STATIC_PATTERN);
    if (localizedStaticMatch) {
        const [, locale, section] = localizedStaticMatch;
        const copy = STATIC_COPY[locale][section];

        if (section === "catalog") {
            const categorySlug = searchParams.get("category");

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
                    const localizedName = trimText(getLocalizedValue(category, "name", locale), 120);
                    return previewResponse(
                        buildPreviewHtml({
                            title: localizedName,
                            description: trimText(copy.description, 200),
                            imageUrl: `${baseUrl}/api/og-image/category/${categorySlug}`,
                            pageUrl,
                            locale,
                            imageType: "image/png",
                        })
                    );
                }
            }
        }

        return previewResponse(
            buildPreviewHtml({
                title: copy.title,
                description: copy.description,
                imageUrl: defaultShareImageUrl,
                pageUrl,
                locale,
                imageType: "image/jpeg",
            })
        );
    }

    const productMatch = previewPath.match(LOCALIZED_PRODUCT_PATTERN);
    if (productMatch) {
        const [, locale, id] = productMatch;
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

        return previewResponse(
            buildPreviewHtml({
                title: trimText(getLocalizedValue(product, "name", locale), 120),
                description: trimText(getLocalizedValue(product, "description", locale), 200),
                imageUrl: `${baseUrl}/api/og-image/product/${id}`,
                pageUrl,
                locale,
                imageType: "image/png",
            })
        );
    }

    const serviceMatch = previewPath.match(LOCALIZED_SERVICE_PATTERN);
    if (serviceMatch) {
        const [, locale, id] = serviceMatch;
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

        return previewResponse(
            buildPreviewHtml({
                title: trimText(getLocalizedValue(service, "title", locale), 120),
                description: trimText(getLocalizedValue(service, "description", locale), 200),
                imageUrl: `${baseUrl}/api/og-image/service/${id}`,
                pageUrl,
                locale,
                imageType: "image/png",
            })
        );
    }

    return previewResponse(
        buildPreviewHtml({
            title: "IVORY",
            description: "Inventory rental for weddings and events.",
            imageUrl: defaultShareImageUrl,
            pageUrl,
            locale: "ka",
            imageType: "image/jpeg",
        })
    );
}
