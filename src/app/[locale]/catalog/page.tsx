import prisma from "@/lib/prisma";
import { CatalogClient } from "@/components/features/CatalogClient";
import { getBaseMetadata } from "@/lib/metadata";
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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    return getBaseMetadata(locale, '/catalog');
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
