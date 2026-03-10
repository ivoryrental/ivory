import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { categorySchema, formatZodErrors } from "@/lib/validation";
import { requireAdminApiAccess } from "@/lib/request-security";
import { findOrRestoreCategoryBySlug } from "@/lib/category-utils";

// Get all active categories (not deleted)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const includeDeleted = searchParams.get('includeDeleted') === 'true';

        if (includeDeleted) {
            const authError = await requireAdminApiAccess(request, { requireCsrf: false });
            if (authError) return authError;
        }
        
        const categories = await prisma.category.findMany({
            where: includeDeleted ? {} : { deletedAt: null },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const authError = await requireAdminApiAccess(req);
    if (authError) return authError;

    try {
        const body = await req.json();
        
        // Validate input
        const validation = categorySchema.safeParse(body);
        if (!validation.success) {
            const errors = formatZodErrors(validation.error);
            return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
        }

        const { name, name_ka, name_ru, image, slug: rSlug } = validation.data;

        // Check for duplicate slug (global unique in DB)
        const existing = await prisma.category.findUnique({
            where: { slug: rSlug }
        });
        if (existing && !existing.deletedAt) {
            return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 409 });
        }

        const wasRestored = Boolean(existing?.deletedAt);
        const category = await findOrRestoreCategoryBySlug(rSlug, {
            name,
            name_ka,
            name_ru,
            image,
        });

        return NextResponse.json(category, { status: wasRestored ? 200 : 201 });
    } catch (error) {
        console.error("Category create error:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
