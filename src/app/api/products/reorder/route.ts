import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { reorderSchema, formatZodErrors } from '@/lib/validation';
import { requireAdminApiAccess } from '@/lib/request-security';

export async function POST(request: Request) {
    const authError = await requireAdminApiAccess(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        
        // Validate input
        const validation = reorderSchema.safeParse(body.products);
        if (!validation.success) {
            const errors = formatZodErrors(validation.error);
            return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
        }

        const products = validation.data;
        
        // Update each product's sortOrder
        const updates = products.map((p) =>
            prisma.product.update({
                where: { id: p.id },
                data: { sortOrder: p.sortOrder }
            })
        );
        
        await Promise.all(updates);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to reorder products:', error);
        return NextResponse.json({ error: 'Failed to reorder products' }, { status: 500 });
    }
}
