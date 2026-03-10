import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serviceUpdateSchema, formatZodErrors } from '@/lib/validation';
import { requireAdminApiAccess } from '@/lib/request-security';

// SOFT DELETE - marks service as deleted
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdminApiAccess(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        
        // Soft delete: set deletedAt to current time
        const service = await prisma.service.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Service moved to trash',
            deletedAt: service.deletedAt 
        });
    } catch (error) {
        console.error('Failed to delete service:', error);
        return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }
}

// RESTORE or PERMANENT DELETE
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
            const service = await prisma.service.update({
                where: { id },
                data: { deletedAt: null }
            });
            return NextResponse.json({ 
                success: true, 
                message: 'Service restored',
                service 
            });
        }
        
        if (action === 'permanent-delete') {
            // Permanent delete
            await prisma.service.delete({
                where: { id }
            });
            return NextResponse.json({ 
                success: true, 
                message: 'Service permanently deleted' 
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Failed to process service:', error);
        return NextResponse.json({ error: 'Failed to process service' }, { status: 500 });
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
        const validation = serviceUpdateSchema.safeParse(body);
        if (!validation.success) {
            const errors = formatZodErrors(validation.error);
            return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
        }

        const data = validation.data;

        const updateData: Record<string, unknown> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.title_ka !== undefined) updateData.title_ka = data.title_ka;
        if (data.title_ru !== undefined) updateData.title_ru = data.title_ru;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.description_ka !== undefined) updateData.description_ka = data.description_ka;
        if (data.description_ru !== undefined) updateData.description_ru = data.description_ru;
        if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
        
        if (data.images !== undefined) {
            updateData.images = JSON.stringify(data.images);
        }

        const service = await prisma.service.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(service);
    } catch (error) {
        console.error('Failed to update service:', error);
        return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }
}
