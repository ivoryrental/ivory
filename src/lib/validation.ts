import { z } from 'zod';
import { normalizeImageLink } from '@/lib/utils';

function normalizeSubmittedImageUrl(value: unknown) {
    if (typeof value !== "string") return value;

    const trimmed = value.trim();
    if (!trimmed) return trimmed;

    if (trimmed.startsWith("/api/image?url=")) {
        try {
            const parsed = new URL(trimmed, "https://ivory.ge");
            const source = parsed.searchParams.get("url");
            if (source) {
                return normalizeImageLink(decodeURIComponent(source));
            }
        } catch {
            return trimmed;
        }
    }

    return normalizeImageLink(trimmed);
}

const imageUrlSchema = z.preprocess(
    (val) => normalizeSubmittedImageUrl(val),
    z.string().url().max(1000)
);

// Product validation schemas
export const productSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    name_ka: z.string().max(200).optional(),
    name_ru: z.string().max(200).optional(),
    description: z.string().min(1, 'Description is required').max(5000),
    description_ka: z.string().max(5000).optional(),
    description_ru: z.string().max(5000).optional(),
    // Accept string or number, coerce to number, validate positive
    price: z.coerce.number().positive('Price must be positive'),
    category: z.string().min(1, 'Category is required'),
    images: z.array(imageUrlSchema).max(25).default([]),
    // Normalize empty strings to null for optional URL
    videoUrl: z.preprocess(
        (val) => (val === '' || val === undefined ? null : val),
        z.string().url().max(1000).nullable().optional()
    ),
});

export const productUpdateSchema = productSchema.partial();

// Category validation schemas
export const categorySchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    name_ka: z.string().max(100).optional(),
    name_ru: z.string().max(100).optional(),
    slug: z.string()
        .min(1, 'Slug is required')
        .max(50)
        .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only'),
    // Normalize empty strings to undefined for optional URL
    image: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.string().url().max(1000).optional()
    ),
});

export const categoryUpdateSchema = categorySchema.partial();

// Service validation schemas
export const serviceSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    title_ka: z.string().max(200).optional(),
    title_ru: z.string().max(200).optional(),
    description: z.string().min(1, 'Description is required').max(5000),
    description_ka: z.string().max(5000).optional(),
    description_ru: z.string().max(5000).optional(),
    images: z.array(imageUrlSchema).max(25).default([]),
    // Normalize empty strings to null for optional URL
    videoUrl: z.preprocess(
        (val) => (val === '' || val === undefined ? null : val),
        z.string().url().max(1000).nullable().optional()
    ),
});

export const serviceUpdateSchema = serviceSchema.partial();

// Booking/Contact form validation
export const contactFormSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email').max(100),
    phone: z.string().max(50).optional(),
    message: z.string().min(1, 'Message is required').max(5000),
    items: z.array(z.object({
        id: z.string().min(1).max(100),
        name: z.string().min(1).max(200),
        price: z.coerce.number().nonnegative().max(1_000_000),
        quantity: z.coerce.number().int().positive().max(1000),
    })).max(100).optional(),
    totalAmount: z.coerce.number().nonnegative().max(100_000_000).optional(),
});

// Booking status update
export const bookingStatusSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
    message: z.string().max(10000).optional(),
});

// Product reorder
export const reorderSchema = z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int().nonnegative(),
}));

// Helper to format Zod errors into readable strings
export function formatZodErrors(error: z.ZodError): string[] {
    return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}
