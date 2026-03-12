import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { reorderSchema, formatZodErrors } from '@/lib/validation';
import { requireAdminApiAccess } from '@/lib/request-security';

export async function POST(request: Request) {
    const authError = await requireAdminApiAccess(request);
    if (authError) return authError;

    try {
        const body = await request.json();

        const validation = reorderSchema.safeParse(body.categories);
        if (!validation.success) {
            const errors = formatZodErrors(validation.error);
            return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
        }

        const categories = validation.data;

        const updates = categories.map((category) =>
            prisma.category.update({
                where: { id: category.id },
                data: { sortOrder: category.sortOrder }
            })
        );

        await Promise.all(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to reorder categories:', error);
        return NextResponse.json({ error: 'Failed to reorder categories' }, { status: 500 });
    }
}
