import prisma from "@/lib/prisma";

interface CategorySeedData {
    name?: string;
    name_ka?: string | null;
    name_ru?: string | null;
    image?: string | null;
    sortOrder?: number;
}

function slugifyCategory(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

export async function findOrRestoreCategoryBySlug(
    slug: string,
    data: CategorySeedData = {}
) {
    const existing = await prisma.category.findUnique({
        where: { slug },
    });

    if (!existing) {
        return prisma.category.create({
            data: {
                slug,
                name: data.name ?? slug,
                name_ka: data.name_ka ?? null,
                name_ru: data.name_ru ?? null,
                image: data.image ?? null,
                sortOrder: data.sortOrder ?? 0,
            },
        });
    }

    if (!existing.deletedAt) {
        return existing;
    }

    const updateData: CategorySeedData & { deletedAt: null } = {
        deletedAt: null,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.name_ka !== undefined) updateData.name_ka = data.name_ka;
    if (data.name_ru !== undefined) updateData.name_ru = data.name_ru;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    return prisma.category.update({
        where: { id: existing.id },
        data: updateData,
    });
}

export async function resolveProductCategory(categoryInput: string) {
    const normalizedName = categoryInput.trim();
    const slug = slugifyCategory(normalizedName);
    if (!slug) {
        throw new Error("Invalid category value");
    }

    return findOrRestoreCategoryBySlug(slug, {
        name: normalizedName || slug,
    });
}
