import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminApiAccess } from '@/lib/request-security';

export async function GET(request: Request) {
    const authError = await requireAdminApiAccess(request, { requireCsrf: false });
    if (authError) return authError;

    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Limit heavy "popular items" parsing to recent activity.
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const [totalProducts, activeRentals, uniqueCustomers, revenueAggregate, dailyBookingsRaw, allBookings] = await Promise.all([
            prisma.product.count({
                where: { deletedAt: null }
            }),
            prisma.booking.count({
                where: { status: 'confirmed' }
            }),
            prisma.booking.findMany({
                where: { status: { not: 'trashed' } },
                distinct: ['email'],
                select: { email: true }
            }),
            prisma.booking.aggregate({
                where: {
                    createdAt: { gte: monthStart },
                    status: { notIn: ['cancelled', 'trashed'] }
                },
                _sum: {
                    totalAmount: true
                }
            }),
            prisma.booking.findMany({
                where: {
                    status: { not: 'trashed' },
                    createdAt: {
                        gte: thirtyDaysAgo
                    }
                },
                select: {
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'asc'
                }
            }),
            prisma.booking.findMany({
                where: {
                    status: { notIn: ['cancelled', 'trashed'] },
                    createdAt: { gte: ninetyDaysAgo }
                },
                select: {
                    items: true
                }
            })
        ]);

        // Group bookings by date
        const bookingsByDate = dailyBookingsRaw.reduce((acc: Record<string, number>, booking) => {
            const date = booking.createdAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        // Create chart data for last 14 days
        const chartData = [];
        for (let i = 13; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            chartData.push({
                date: dateStr,
                count: bookingsByDate[dateStr] || 0
            });
        }

        // Calculate popular items
        const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
        
        allBookings.forEach(booking => {
            try {
                const items = JSON.parse(booking.items);
                items.forEach((item: { id?: string; name: string; price: number; quantity?: number }) => {
                    const key = item.id || item.name;
                    if (!itemCounts[key]) {
                        itemCounts[key] = {
                            name: item.name,
                            count: 0,
                            revenue: 0
                        };
                    }
                    itemCounts[key].count += item.quantity || 1;
                    itemCounts[key].revenue += (item.price * (item.quantity || 1));
                });
            } catch {
                // Skip invalid items
            }
        });

        // Sort by count and get top 5
        const popularItems = Object.values(itemCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return NextResponse.json({
            totalProducts,
            activeRentals,
            totalCustomers: uniqueCustomers.length,
            monthlyRevenue: revenueAggregate._sum.totalAmount || 0,
            chartData,
            popularItems
        });
    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
