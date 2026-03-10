import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { productUpdateSchema, formatZodErrors } from '@/lib/validation';
import { requireAdminApiAccess } from '@/lib/request-security';
import { resolveProductCategory } from '@/lib/category-utils';

// SOFT DELETE - marks product as deleted instead of removing
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdminApiAccess(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        
        // Soft delete: set deletedAt to current time
        const product = await prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Product moved to trash',
            deletedAt: product.deletedAt 
        });
    } catch (error) {
        console.error('Failed to delete product:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}

// PERMANENT DELETE - only for trash cleanup
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdminApiAccess(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        const { action } = await request.json();
        
        if (action === 'restore') {
            // Restore from trash
            const product = await prisma.product.update({
                where: { id },
                data: { deletedAt: null }
            });
            return NextResponse.json({ 
                success: true, 
                message: 'Product restored',
                product 
            });
        }
        
        if (action === 'permanent-delete') {
            // Permanent delete
            await prisma.product.delete({
                where: { id }
            });
            return NextResponse.json({ 
                success: true, 
                message: 'Product permanently deleted' 
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Failed to process product:', error);
        return NextResponse.json({ error: 'Failed to process product' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdminApiAccess(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        const body = await request.json();

        // Validate input
        const validation = productUpdateSchema.safeParse(body);
        if (!validation.success) {
            const errors = formatZodErrors(validation.error);
            return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
        }

        const data = validation.data;

        // Build update data dynamically
        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.name_ka !== undefined) updateData.name_ka = data.name_ka;
        if (data.name_ru !== undefined) updateData.name_ru = data.name_ru;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.description_ka !== undefined) updateData.description_ka = data.description_ka;
        if (data.description_ru !== undefined) updateData.description_ru = data.description_ru;
        if (data.price !== undefined) updateData.price = Number(data.price);
        if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
        
        if (data.images !== undefined) {
            updateData.images = JSON.stringify(data.images);
        }

        // Handle category update
        if (data.category) {
            const cat = await resolveProductCategory(data.category);
            updateData.categoryId = cat.id;
        }

        const product = await prisma.product.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(product);
    } catch (error) {
        if (error instanceof Error && error.message === 'Invalid category value') {
            return NextResponse.json({ error: 'Invalid category value' }, { status: 400 });
        }
        console.error('Update error:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}
