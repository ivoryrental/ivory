import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { categoryUpdateSchema, formatZodErrors } from "@/lib/validation";
import { requireAdminApiAccess } from "@/lib/request-security";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdminApiAccess(req);
    if (authError) return authError;

    const { id } = await params;
    try {
        const body = await req.json();

        // Validate input
        const validation = categoryUpdateSchema.safeParse(body);
        if (!validation.success) {
            const errors = formatZodErrors(validation.error);
            return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
        }

        const data = validation.data;

        // Check for duplicate slug if slug is being updated (only in active categories)
        if (data.slug) {
            const existing = await prisma.category.findUnique({
                where: { slug: data.slug }
            });
            if (existing && existing.id !== id) {
                const message = existing.deletedAt
                    ? 'A deleted category with this slug already exists. Restore or permanently delete it first.'
                    : 'Another category with this slug already exists';
                return NextResponse.json({ error: message }, { status: 409 });
            }
        }

        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.name_ka !== undefined) updateData.name_ka = data.name_ka;
        if (data.name_ru !== undefined) updateData.name_ru = data.name_ru;
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.image !== undefined) updateData.image = data.image;

        const category = await prisma.category.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Category update error:", error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

// SOFT DELETE - marks category as deleted
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdminApiAccess(req);
    if (authError) return authError;

    const { id } = await params;
    try {
        // Soft delete: set deletedAt to current time
        const category = await prisma.category.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Category moved to trash',
            deletedAt: category.deletedAt 
        });
    } catch (error) {
        console.error("Category delete error:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}

// RESTORE or PERMANENT DELETE
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdminApiAccess(req);
    if (authError) return authError;

    const { id } = await params;
    try {
        const { action } = await req.json();
        
        if (action === 'restore') {
            // Restore from trash
            const category = await prisma.category.update({
                where: { id },
                data: { deletedAt: null }
            });
            return NextResponse.json({ 
                success: true, 
                message: 'Category restored',
                category 
            });
        }
        
        if (action === 'permanent-delete') {
            const linkedProductsCount = await prisma.product.count({
                where: { categoryId: id }
            });

            if (linkedProductsCount > 0) {
                return NextResponse.json(
                    {
                        error: `Cannot delete category with ${linkedProductsCount} linked product(s). Delete or reassign those products first.`,
                    },
                    { status: 409 }
                );
            }

            // Permanent delete
            await prisma.category.delete({
                where: { id }
            });
            return NextResponse.json({ 
                success: true, 
                message: 'Category permanently deleted' 
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error("Category patch error:", error);
        return NextResponse.json({ error: "Failed to process category" }, { status: 500 });
    }
}
