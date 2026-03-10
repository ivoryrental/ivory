import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { reorderSchema, formatZodErrors } from '@/lib/validation';
import { requireAdminApiAccess } from '@/lib/request-security';

export async function POST(request: Request) {
    const authError = await requireAdminApiAccess(request);
    if (authError) return authError;

    try {
        const body = await request.json();

        const validation = reorderSchema.safeParse(body.services);
        if (!validation.success) {
            const errors = formatZodErrors(validation.error);
            return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
        }

        const services = validation.data;

        const updates = services.map((service) =>
            prisma.service.update({
                where: { id: service.id },
                data: { sortOrder: service.sortOrder }
            })
        );

        await Promise.all(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to reorder services:', error);
        return NextResponse.json({ error: 'Failed to reorder services' }, { status: 500 });
    }
}
