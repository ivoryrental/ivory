import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { contactFormSchema, formatZodErrors } from '@/lib/validation';

/**
 * HTML escape utility to prevent XSS in email templates
 */
function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
    try {
        const contentLengthHeader = request.headers.get("content-length");
        if (contentLengthHeader) {
            const contentLength = Number(contentLengthHeader);
            if (!Number.isNaN(contentLength) && contentLength > 100_000) {
                return NextResponse.json({ error: "Payload too large" }, { status: 413 });
            }
        }

        const body = await request.json();
        
        // Validate input
        const validation = contactFormSchema.safeParse(body);
        if (!validation.success) {
            const errors = formatZodErrors(validation.error);
            return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
        }

        const { name, email, message, phone, items, totalAmount } = validation.data;

        // 1. Save to Database
        let booking = null;
        if (items && items.length > 0) {
            booking = await prisma.booking.create({
                data: {
                    customerName: name,
                    email,
                    phone: phone || '',
                    message,
                    items: JSON.stringify(items),
                    totalAmount: totalAmount || 0,
                    status: 'pending'
                }
            });
        } else {
            // Save as a simple lead if no items
            await prisma.lead.create({
                data: {
                    name,
                    email,  // Now included in schema
                    phone: phone || '',
                    message,
                    status: 'NEW'
                }
            });
        }

        // 2. Send Email Notification
        const smtpConfigured = Boolean(
            process.env.SMTP_HOST &&
            process.env.SMTP_PORT &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS &&
            process.env.SMTP_FROM &&
            process.env.ADMIN_EMAIL
        );

        if (smtpConfigured) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT),
                    secure: process.env.SMTP_PORT === '465',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });

                // Escape user input for safe HTML email
                const safeName = escapeHtml(name);
                const safeEmail = escapeHtml(email);
                const safePhone = phone ? escapeHtml(phone) : 'N/A';
                const safeMessage = escapeHtml(message);
                
                const itemsHtml = items?.map((item) => {
                    const safeItemName = escapeHtml(item.name);
                    return `<li>${safeItemName} x${item.quantity} - ₾${item.price * item.quantity}</li>`;
                }).join('') || '';
                
                const deliveryNoticeHtml = items ? `
                    <div style="margin-top: 20px; padding: 10px; border: 1px solid #ff0000; color: #ff0000; font-weight: bold;">
                        ფასში არ შედის ტრანსპორტირება და სხვა დამატებითი მომსახურებები, რომლებიც ითვლება ინდივიდუალურად. ამ საკითხების დასაზუსტებლად დაგიკავშირდებათ მენეჯერი.
                    </div>
                ` : '';
                
                const cartSection = items ? `<h3>Cart Items:</h3><ul>${itemsHtml}</ul><p><b>Total: ₾${totalAmount}</b></p>${deliveryNoticeHtml}` : '';

                await transporter.sendMail({
                    from: process.env.SMTP_FROM,
                    to: process.env.ADMIN_EMAIL,
                    subject: `New Booking Request from ${safeName}`,
                    replyTo: email,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                            <h2 style="color: #6d28d9; border-bottom: 2px solid #6d28d9; padding-bottom: 10px;">New Booking Request</h2>
                            <p><b>Name:</b> ${safeName}</p>
                            <p><b>Email:</b> ${safeEmail}</p>
                            <p><b>Phone:</b> ${safePhone}</p>
                            <p><b>Message:</b></p>
                            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                                <pre style="white-space: pre-wrap;">${safeMessage}</pre>
                            </div>
                            ${cartSection}
                        </div>
                    `,
                });
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
                // We don't return error here because the DB save was successful
            }
        } else {
            console.warn('SMTP is not configured. Email notification skipped.');
        }

        return NextResponse.json({ success: true, bookingId: booking?.id }, { status: 201 });
    } catch (error) {
        console.error('Contact API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
