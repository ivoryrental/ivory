/**
 * Trash Cleanup Script
 * 
 * This script permanently deletes items that have been in trash for more than 48 hours.
 * 
 * Usage:
 *   node scripts/cleanup-trash.mjs
 * 
 * Recommended: Run this script every hour using a cron job or scheduled task:
 * 
 * Linux/Mac (crontab -e):
 *   0 * * * * cd /path/to/project && node scripts/cleanup-trash.mjs >> /var/log/trash-cleanup.log 2>&1
 * 
 * Windows (Task Scheduler):
 *   Program: node
 *   Arguments: scripts/cleanup-trash.mjs
 *   Working Directory: C:\path\to\project
 *   Trigger: Every 1 hour
 * 
 * Vercel (recommended for production):
 *   Use Vercel Cron Jobs - add to vercel.json:
 *   {
 *     "crons": [
 *       {
 *         "path": "/api/cron/cleanup-trash",
 *         "schedule": "0 * * * *"
 *       }
 *     ]
 *   }
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const HOURS_48 = 48 * 60 * 60 * 1000;

async function cleanupTrash() {
    console.log(`[${new Date().toISOString()}] Starting trash cleanup...`);
    
    try {
        const cutoffDate = new Date(Date.now() - HOURS_48);
        
        // Find items to delete
        const [oldProducts, oldCategories, oldServices, oldBookings] = await Promise.all([
            prisma.product.findMany({
                where: { deletedAt: { lt: cutoffDate } },
                select: { id: true, name: true, deletedAt: true }
            }),
            prisma.category.findMany({
                where: {
                    deletedAt: { lt: cutoffDate },
                    products: { none: {} }
                },
                select: { id: true, name: true, deletedAt: true }
            }),
            prisma.service.findMany({
                where: { deletedAt: { lt: cutoffDate } },
                select: { id: true, title: true, deletedAt: true }
            }),
            prisma.booking.findMany({
                where: {
                    status: 'trashed',
                    updatedAt: { lt: cutoffDate }
                },
                select: { id: true, customerName: true, updatedAt: true }
            })
        ]);
        
        const totalToDelete = oldProducts.length + oldCategories.length + oldServices.length + oldBookings.length;
        
        if (totalToDelete === 0) {
            console.log('No items older than 48 hours found.');
            return;
        }
        
        console.log(`Found ${totalToDelete} items to delete:`);
        console.log(`  - Products: ${oldProducts.length}`);
        console.log(`  - Categories: ${oldCategories.length}`);
        console.log(`  - Services: ${oldServices.length}`);
        console.log(`  - Bookings: ${oldBookings.length}`);
        
        // Delete in FK-safe order: products -> categories -> services -> bookings.
        // Categories are deleted only when no products reference them.
        const products = await prisma.product.deleteMany({
            where: { deletedAt: { lt: cutoffDate } }
        });
        const categories = await prisma.category.deleteMany({
            where: {
                deletedAt: { lt: cutoffDate },
                products: { none: {} }
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
        
        console.log(`✅ Cleanup complete:`);
        console.log(`  - Deleted ${products.count} products`);
        console.log(`  - Deleted ${categories.count} categories`);
        console.log(`  - Deleted ${services.count} services`);
        console.log(`  - Deleted ${bookings.count} bookings`);
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    cleanupTrash();
}

export { cleanupTrash };
