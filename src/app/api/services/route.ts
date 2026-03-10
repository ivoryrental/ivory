import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serviceSchema, formatZodErrors } from '@/lib/validation';
import { requireAdminApiAccess } from '@/lib/request-security';

// Get all active services (not deleted)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const includeDeleted = searchParams.get('includeDeleted') === 'true';

        if (includeDeleted) {
            const authError = await requireAdminApiAccess(request, { requireCsrf: false });
            if (authError) return authError;
        }
        
        const services = await prisma.service.findMany({
            where: includeDeleted ? {} : { deletedAt: null },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
        });
        return NextResponse.json(services);
    } catch (error) {
        console.error('Failed to fetch services:', error);
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authError = await requireAdminApiAccess(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        
        // Validate input
        const validation = serviceSchema.safeParse(body);
        if (!validation.success) {
            const errors = formatZodErrors(validation.error);
            return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
        }

        const data = validation.data;

        const maxOrder = await prisma.service.aggregate({
            _max: { sortOrder: true }
        });
        const nextSortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

        const service = await prisma.service.create({
            data: {
                title: data.title,
                title_ka: data.title_ka,
                title_ru: data.title_ru,
                description: data.description,
                description_ka: data.description_ka,
                description_ru: data.description_ru,
                images: JSON.stringify(data.images || []),
                sortOrder: nextSortOrder,
                videoUrl: data.videoUrl || null,
            }
        });

        return NextResponse.json(service, { status: 201 });
    } catch (error) {
        console.error('Failed to create service:', error);
        return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }
}
