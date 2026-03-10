import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminApiAccess } from '@/lib/request-security';

export async function GET(request: Request) {
    const authError = await requireAdminApiAccess(request, { requireCsrf: false });
    if (authError) return authError;

    try {
        const unseenCount = await prisma.booking.count({
            where: {
                seenByAdmin: false,
                status: { not: 'trashed' }
            }
        });

        const recentBookings = await prisma.booking.findMany({
            where: { status: { not: 'trashed' } },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, customerName: true, status: true, seenByAdmin: true }
        });

        return NextResponse.json({ unseenCount, recentBookings });
    } catch (error) {
        console.error('Failed to fetch admin notifications:', error);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authError = await requireAdminApiAccess(request);
    if (authError) return authError;

    try {
        await prisma.booking.updateMany({
            where: {
                seenByAdmin: false,
                status: { not: 'trashed' }
            },
            data: { seenByAdmin: true }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to mark admin notifications as seen:', error);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
