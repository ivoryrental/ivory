import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { productSchema, formatZodErrors } from '@/lib/validation';
import { requireAdminApiAccess } from '@/lib/request-security';
import { resolveProductCategory } from '@/lib/category-utils';

// Get all active products (not deleted)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const includeDeleted = searchParams.get('includeDeleted') === 'true';

        if (includeDeleted) {
            const authError = await requireAdminApiAccess(request, { requireCsrf: false });
            if (authError) return authError;
        }
        
        const products = await prisma.product.findMany({
            where: includeDeleted ? {} : { deletedAt: null },
            include: { category: true },
            orderBy: { sortOrder: 'asc' }
        });
        return NextResponse.json(products);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authError = await requireAdminApiAccess(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        
        // Validate input
        const validation = productSchema.safeParse(body);
        if (!validation.success) {
            const errors = formatZodErrors(validation.error);
            return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
        }

        const { name, name_ka, name_ru, description, description_ka, description_ru, price, category, images, videoUrl } = validation.data;

        const cat = await resolveProductCategory(category);

        const newProduct = await prisma.product.create({
            data: {
                name,
                name_ka,
                name_ru,
                description: description || '',
                description_ka,
                description_ru,
                price: Number(price),
                categoryId: cat.id,
                images: JSON.stringify(images || []),
                videoUrl: videoUrl || null,
            }
        });

        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.message === 'Invalid category value') {
            return NextResponse.json({ error: 'Invalid category value' }, { status: 400 });
        }
        console.error('Failed to create product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
