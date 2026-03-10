import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { timingSafeEqual } from 'crypto';

/**
 * Cron Job: Cleanup trash items older than 48 hours
 * 
 * Security: Requires Bearer token authentication (CRON_SECRET env var)
 * Vercel Cron sets the Authorization header automatically in production.
 * Manual execution: curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/cleanup-trash
 */

const HOURS_48 = 48 * 60 * 60 * 1000;

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    try {
        return timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
        return false;
    }
}

export async function GET(request: Request) {
    // Strict authentication: Bearer token only
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret) {
        console.error('[Cron] CRON_SECRET environment variable is not set');
        return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
        );
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[Cron] Missing or invalid Authorization header');
        return NextResponse.json(
            { error: 'Unauthorized: Bearer token required' },
            { status: 401 }
        );
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    if (!safeCompare(token, expectedSecret)) {
        console.warn('[Cron] Invalid Bearer token');
        return NextResponse.json(
            { error: 'Unauthorized: Invalid token' },
            { status: 401 }
        );
    }

    try {
        const cutoffDate = new Date(Date.now() - HOURS_48);

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

        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            deleted: {
                products: products.count,
                categories: categories.count,
                services: services.count,
                bookings: bookings.count
            },
            total: products.count + categories.count + services.count + bookings.count
        };

        console.log('[Cron] Trash cleanup completed:', result);
        return NextResponse.json(result);
    } catch (error) {
        console.error('[Cron] Trash cleanup failed:', error);
        return NextResponse.json(
            { error: 'Cleanup failed' },
            { status: 500 }
        );
    }
}
