import prisma from "@/lib/prisma";
import { CatalogClient } from "@/components/features/CatalogClient";
import { baseUrl, getBaseMetadata } from "@/lib/metadata";
import { Metadata } from 'next';
import { setRequestLocale } from "next-intl/server";
import { Prisma } from "@prisma/client";

interface SerializedCategory {
    id: string;
    name: string;
    name_ka?: string | null;
    name_ru?: string | null;
    slug: string;
    image?: string | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

interface SerializedProduct {
    id: string;
    name: string;
    name_ka?: string | null;
    name_ru?: string | null;
    description: string;
    description_ka?: string | null;
    description_ru?: string | null;
    price: number;
    images: string;
    isFeatured: boolean;
    sortOrder: number;
    videoUrl?: string | null;
    categoryId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
    category: SerializedCategory;
}

const CATALOG_METADATA_COPY: Record<string, { title: string; description: string; categoryDescription: (name: string) => string }> = {
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

function getLocalizedCategoryName(category: Pick<SerializedCategory, "name" | "name_ka" | "name_ru">, locale: string) {
    if (locale === "ka" && category.name_ka) return category.name_ka;
    if (locale === "ru" && category.name_ru) return category.name_ru;
    return category.name;
}

export async function generateMetadata({
    params,
    searchParams
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const resolvedSearchParams = await searchParams;
    const categorySlug = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : undefined;
    const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined;
    const page = typeof resolvedSearchParams.page === 'string' ? resolvedSearchParams.page : undefined;
    const pageParams = new URLSearchParams();
    const copy = CATALOG_METADATA_COPY[locale] ?? CATALOG_METADATA_COPY.ka;

    if (categorySlug) pageParams.set('category', categorySlug);
    if (search) pageParams.set('search', search);
    if (page && page !== '1') pageParams.set('page', page);

    const metadataPath = `/catalog${pageParams.toString() ? `?${pageParams.toString()}` : ''}`;

    if (!categorySlug) {
        return getBaseMetadata(locale, metadataPath, {
            title: copy.title,
            description: copy.description,
        });
    }

    const category = await prisma.category.findFirst({
        where: {
            slug: categorySlug,
            deletedAt: null,
        },
        select: {
            name: true,
            name_ka: true,
            name_ru: true,
        }
    });

    if (!category) {
        return getBaseMetadata(locale, metadataPath, {
            title: copy.title,
            description: copy.description,
        });
    }

    const localizedCategoryName = getLocalizedCategoryName(category, locale);
    const imageUrl = `${baseUrl}/api/og-image/category/${categorySlug}`;
    const baseMetadata = getBaseMetadata(locale, metadataPath, {
        title: localizedCategoryName,
        description: copy.categoryDescription(localizedCategoryName),
        imageAlt: localizedCategoryName,
    });

    return {
        ...baseMetadata,
        openGraph: {
            ...baseMetadata.openGraph,
            images: [
                {
                    url: imageUrl,
                    secureUrl: imageUrl,
                    type: 'image/png',
                    width: 1200,
                    height: 630,
                    alt: localizedCategoryName,
                },
            ],
        },
        twitter: {
            ...baseMetadata.twitter,
            images: [imageUrl],
        },
    };
}

export default async function CatalogPage({
    params,
    searchParams
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const resolvedSearchParams = await searchParams;

    const page = Number(resolvedSearchParams.page) || 1;
    const limit = 12; // Products per page
    const skip = (page - 1) * limit;
    const categorySlug = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : undefined;
    const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined;

    // Base filter: only active (not deleted) products
    const where: Prisma.ProductWhereInput = {
        deletedAt: null
    };

    if (categorySlug) {
        where.category = { slug: categorySlug };
    }

    if (search) {
        where.OR = [
            { name: { contains: search } },
            // Add localized search if schema supports it, assuming fields exist as verified in AdminPage
            { name_ka: { contains: search } },
            { name_ru: { contains: search } }
        ];
    }

    const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
            where,
            include: { category: true },
            orderBy: { sortOrder: 'asc' },
            skip,
            take: limit
        }),
        prisma.product.count({ where })
    ]);

    // Only fetch active categories
    const categories = await prisma.category.findMany({
        where: { deletedAt: null },
        orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'asc' }
        ]
    });

    // Transform products to match CatalogClient interface if necessary
    // Prisma returns Date objects for createdAt, but CatalogClient might expect serialized JSON if passed from server to client?
    // Actually, Server Components passing data to Client Components need serializable data.
    // Prisma dates are objects.
    const serializedProducts: SerializedProduct[] = products.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        deletedAt: p.deletedAt?.toISOString() ?? null,
        // Ensure price is number
        price: Number(p.price),
        // Serialize nested category dates
        category: {
            ...p.category,
            createdAt: p.category.createdAt.toISOString(),
            updatedAt: p.category.updatedAt.toISOString(),
            deletedAt: p.category.deletedAt?.toISOString() ?? null
        }
    }));

    const serializedCategories: SerializedCategory[] = categories.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        deletedAt: c.deletedAt?.toISOString() ?? null
    }));

    return (
        <div className="container mx-auto px-4 pb-8 pt-4">
            <CatalogClient
                initialProducts={serializedProducts as SerializedProduct[]}
                categories={serializedCategories as SerializedCategory[]}
                locale={locale}
                totalProducts={totalCount}
                currentPage={page}
                productsPerPage={limit}
            />
        </div>
    );
}
