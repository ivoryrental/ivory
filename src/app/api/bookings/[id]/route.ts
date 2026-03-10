import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { bookingStatusSchema, formatZodErrors } from '@/lib/validation';
import { requireAdminApiAccess } from '@/lib/request-security';

const RESTORE_STATUS = 'pending';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdminApiAccess(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        const body = await request.json();

        if (body && typeof body === 'object' && 'action' in body) {
            const action = (body as { action?: unknown }).action;

            if (action === 'restore') {
                const booking = await prisma.booking.findUnique({
                    where: { id },
                    select: { status: true },
                });

                if (!booking) {
                    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
                }

                if (booking.status !== 'trashed') {
                    return NextResponse.json({ error: 'Booking is not in trash' }, { status: 400 });
                }

                const restoredBooking = await prisma.booking.update({
                    where: { id },
                    data: { status: RESTORE_STATUS }
                });

                return NextResponse.json({
                    success: true,
                    message: 'Booking restored',
                    booking: restoredBooking
                });
            }

            if (action === 'permanent-delete') {
                const booking = await prisma.booking.findUnique({
                    where: { id },
                    select: { status: true },
                });

                if (!booking) {
                    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
                }

                if (booking.status !== 'trashed') {
                    return NextResponse.json({ error: 'Booking is not in trash' }, { status: 400 });
                }

                await prisma.booking.delete({
                    where: { id }
                });

                return NextResponse.json({
                    success: true,
                    message: 'Booking permanently deleted'
                });
            }

            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Validate input
        const validation = bookingStatusSchema.safeParse(body);
        if (!validation.success) {
            const errors = formatZodErrors(validation.error);
            return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
        }

        const { status, message } = validation.data;

        const data: Record<string, unknown> = {};
        if (status !== undefined) data.status = status;
        if (message !== undefined) data.message = message;

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data
        });

        return NextResponse.json(updatedBooking);
    } catch (error) {
        console.error('Failed to update booking:', error);
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdminApiAccess(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        const trashedBooking = await prisma.booking.update({
            where: { id },
            data: {
                status: 'trashed',
                seenByAdmin: true,
            }
        });
        return NextResponse.json({
            success: true,
            message: 'Booking moved to trash',
            deletedAt: trashedBooking.updatedAt
        });
    } catch (error) {
        console.error('Failed to delete booking:', error);
        return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
    }
}
