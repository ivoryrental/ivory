import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminApiAccess } from '@/lib/request-security';
import { Prisma } from '@prisma/client';

// Safe JSON parse with fallback
function safeJsonParse<T>(jsonString: string, fallback: T): T {
    try {
        return JSON.parse(jsonString) as T;
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        return fallback;
    }
}

interface BookingWithParsedItems {
    id: string;
    customerName: string;
    email: string;
    phone: string | null;
    date: string;
    dateISO: string;
    completedDate: string | null;
    completedDateISO: string | null;
    status: string;
    totalAmount: number;
    items: unknown[];
    message: string | null;
}

export async function GET(request: Request) {
    const authError = await requireAdminApiAccess(request, { requireCsrf: false });
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const where: Prisma.BookingWhereInput = {
            status: { not: 'trashed' }
        };
        if (status === 'active') {
            where.status = { in: ['pending', 'confirmed', 'cancelled'] };
        } else if (status === 'trashed') {
            where.status = 'trashed';
        } else if (status && status !== 'all') {
            where.status = status;
        }

        const bookings = await prisma.booking.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                customerName: true,
                email: true,
                phone: true,
                message: true,
                items: true,
                totalAmount: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        // Map database fields to what the UI expects with safe JSON parsing
        const formattedBookings: BookingWithParsedItems[] = bookings.map((b) => {
            const completedAt = b.status === 'completed' ? b.updatedAt : null;
            return {
                id: b.id,
                customerName: b.customerName,
                email: b.email,
                phone: b.phone,
                date: b.createdAt.toLocaleDateString(),
                dateISO: b.createdAt.toISOString(),
                completedDate: completedAt ? completedAt.toLocaleDateString() : null,
                completedDateISO: completedAt ? completedAt.toISOString() : null,
                status: b.status,
                totalAmount: b.totalAmount,
                // Safe JSON parse - if parsing fails, return empty array
                items: safeJsonParse<unknown[]>(b.items, []),
                message: b.message
            };
        });

        return NextResponse.json(formattedBookings);
    } catch (error) {
        console.error('Failed to fetch bookings details:', error);
        return NextResponse.json({
            error: 'Failed to fetch bookings',
        }, { status: 500 });
    }
}
