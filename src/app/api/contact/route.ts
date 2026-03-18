import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { contactFormSchema, formatZodErrors } from '@/lib/validation';

function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
    try {
        const contentLengthHeader = request.headers.get('content-length');
        if (contentLengthHeader) {
            const contentLength = Number(contentLengthHeader);
            if (!Number.isNaN(contentLength) && contentLength > 100_000) {
                return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
            }
        }

        const body = await request.json();
        const validation = contactFormSchema.safeParse(body);

        if (!validation.success) {
            const errors = formatZodErrors(validation.error);
            return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
        }

        const { name, email, message, phone, items, totalAmount } = validation.data;
        const normalizedItems = items ?? [];
        const hasItems = normalizedItems.length > 0;
        const safeTotalAmount = hasItems ? (totalAmount || 0) : 0;

        if (hasItems) {
            await prisma.booking.create({
                data: {
                    customerName: name,
                    email,
                    phone: phone || '',
                    message,
                    items: JSON.stringify(normalizedItems),
                    totalAmount: safeTotalAmount,
                    status: 'pending'
                }
            });
        } else {
            await prisma.lead.create({
                data: {
                    name,
                    email,
                    phone: phone || '',
                    message,
                    status: 'NEW'
                }
            });
        }

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

                const safeName = escapeHtml(name);
                const safeEmail = escapeHtml(email);
                const safePhone = phone ? escapeHtml(phone) : 'N/A';
                const safeMessage = escapeHtml(message);
                const emailTitle = hasItems ? 'New Booking Request' : 'New Contact Message';
                const subjectName = name.replace(/[\r\n]+/g, ' ').trim();

                const itemsHtml = normalizedItems.map((item) => {
                    const safeItemName = escapeHtml(item.name);
                    return `<li>${safeItemName} x${item.quantity} - ₾${item.price * item.quantity}</li>`;
                }).join('');

                const cartSection = hasItems
                    ? `
                        <h3 style="margin-top: 24px;">Cart Items</h3>
                        <ul>${itemsHtml}</ul>
                        <p><b>Total:</b> ₾${safeTotalAmount}</p>
                        <div style="margin-top: 20px; padding: 12px; border: 1px solid #d4a58e; color: #6b4f43; font-weight: 600; border-radius: 8px; background: #fff7f2;">
                            ფასი არ მოიცავს ტრანსპორტირებასა და დამატებით მომსახურებებს. დეტალებისთვის მენეჯერი დაგიკავშირდებათ.
                        </div>
                    `
                    : `
                        <p style="margin-top: 18px; color: #6b7280;">
                            This message was submitted from the contact form without selected products.
                        </p>
                    `;

                const textBody = [
                    emailTitle,
                    '',
                    `Name: ${name}`,
                    `Email: ${email}`,
                    `Phone: ${phone || 'N/A'}`,
                    '',
                    'Message:',
                    message,
                    '',
                    hasItems ? `Total: ₾${safeTotalAmount}` : 'Source: Contact form',
                    ...normalizedItems.map((item) => `- ${item.name} x${item.quantity} - ₾${item.price * item.quantity}`),
                ].join('\n');

                await transporter.sendMail({
                    from: process.env.SMTP_FROM,
                    to: process.env.ADMIN_EMAIL,
                    subject: `${emailTitle} from ${subjectName}`,
                    replyTo: email,
                    text: textBody,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                            <h2 style="color: #d4a58e; border-bottom: 2px solid #d4a58e; padding-bottom: 10px;">${emailTitle}</h2>
                            <p><b>Name:</b> ${safeName}</p>
                            <p><b>Email:</b> ${safeEmail}</p>
                            <p><b>Phone:</b> ${safePhone}</p>
                            <p><b>Message:</b></p>
                            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                                <pre style="white-space: pre-wrap; margin: 0;">${safeMessage}</pre>
                            </div>
                            ${cartSection}
                        </div>
                    `,
                });
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
            }
        } else {
            console.warn('SMTP is not configured. Email notification skipped.');
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Contact API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
