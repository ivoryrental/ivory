import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminApiAccess } from '@/lib/request-security';

export async function GET(request: Request) {
    const authError = await requireAdminApiAccess(request, { requireCsrf: false });
    if (authError) return authError;

    try {
        const leads = await prisma.lead.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                message: true,
                status: true,
                createdAt: true,
            }
        });

        return NextResponse.json(
            leads.map((lead) => ({
                ...lead,
                date: lead.createdAt.toLocaleDateString(),
                dateISO: lead.createdAt.toISOString(),
            }))
        );
    } catch (error) {
        console.error('Failed to fetch leads:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
