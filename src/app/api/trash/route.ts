import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminApiAccess } from '@/lib/request-security';

interface TypedItem {
    id: string;
    deletedAt: Date | null;
    name?: string;
    title?: string;
    [key: string]: unknown;
}

interface BookingTrashItem {
    id: string;
    customerName: string;
    email: string;
    phone: string | null;
    message: string | null;
    totalAmount: number;
    status: string;
    updatedAt: Date;
}

// Get all deleted items (trash)
export async function GET(request: Request) {
    const authError = await requireAdminApiAccess(request, { requireCsrf: false });
    if (authError) return authError;

    try {
        const [products, categories, services, bookings] = await Promise.all([
            prisma.product.findMany({
                where: { deletedAt: { not: null } },
                include: { category: true },
                orderBy: { deletedAt: 'desc' }
            }),
            prisma.category.findMany({
                where: { deletedAt: { not: null } },
                orderBy: { deletedAt: 'desc' }
            }),
            prisma.service.findMany({
                where: { deletedAt: { not: null } },
                orderBy: { deletedAt: 'desc' }
            }),
            prisma.booking.findMany({
                where: { status: 'trashed' },
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    customerName: true,
                    email: true,
                    phone: true,
                    message: true,
                    totalAmount: true,
                    status: true,
                    updatedAt: true,
                }
            })
        ]);

        // Calculate remaining time for each item (48 hours from deletion)
        const now = new Date();
        const HOURS_48 = 48 * 60 * 60 * 1000;

        const formatItems = (items: TypedItem[], type: string) => 
            items.map(item => ({
                ...item,
                type,
                remainingHours: Math.max(0, Math.round(
                    (HOURS_48 - (now.getTime() - new Date(item.deletedAt!).getTime())) / (60 * 60 * 1000)
                ))
            }));

        const formatBookingItems = (items: BookingTrashItem[]) =>
            items.map((item) => ({
                ...item,
                name: item.customerName,
                deletedAt: item.updatedAt,
                type: 'booking',
                remainingHours: Math.max(0, Math.round(
                    (HOURS_48 - (now.getTime() - new Date(item.updatedAt).getTime())) / (60 * 60 * 1000)
                ))
            }));

        return NextResponse.json({
            products: formatItems(products, 'product'),
            categories: formatItems(categories, 'category'),
            services: formatItems(services, 'service'),
            bookings: formatBookingItems(bookings),
            total: products.length + categories.length + services.length + bookings.length
        });
    } catch (error) {
        console.error('Failed to fetch trash:', error);
        return NextResponse.json({ error: 'Failed to fetch trash' }, { status: 500 });
    }
}

// Clean up items older than 48 hours (can be called manually or by cron)
export async function DELETE(request: Request) {
    const authError = await requireAdminApiAccess(request);
    if (authError) return authError;

    try {
        const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

        // Delete in FK-safe order: products -> categories -> services.
        // Categories are deleted only when no products reference them.
        const products = await prisma.product.deleteMany({
            where: { deletedAt: { lt: cutoffDate } }
        });
        const categories = await prisma.category.deleteMany({
            where: {
                deletedAt: { lt: cutoffDate },
                products: { none: {} },
            }
        });
        const services = await prisma.service.deleteMany({
            where: { deletedAt: { lt: cutoffDate } }
        });
        const bookings = await prisma.booking.deleteMany({
            where: {
                status: 'trashed',
                updatedAt: { lt: cutoffDate }
            }
        });

        return NextResponse.json({
            success: true,
            deleted: {
                products: products.count,
                categories: categories.count,
                services: services.count,
                bookings: bookings.count
            }
        });
    } catch (error) {
        console.error('Failed to clean trash:', error);
        return NextResponse.json({ error: 'Failed to clean trash' }, { status: 500 });
    }
}
