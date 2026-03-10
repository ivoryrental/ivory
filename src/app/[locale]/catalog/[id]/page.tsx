import { notFound } from "next/navigation";
import { ThemeLink as Link } from "@/components/ui/ThemeLink";
import prisma from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductGallery } from "@/components/features/ProductGallery";
import { getBaseMetadata } from "@/lib/metadata";
import { Metadata } from 'next';
import { headers } from "next/headers";

interface Props {
    params: Promise<{ id: string; locale: string }>;
}

interface CategoryWithLocalization {
    id: string;
    name: string;
    name_ka?: string | null;
    name_ru?: string | null;
    slug: string;
}

interface ProductWithLocalization {
    id: string;
    name: string;
    name_ka?: string | null;
    name_ru?: string | null;
    description: string;
    description_ka?: string | null;
    description_ru?: string | null;
    price: number;
    images: string;
    videoUrl?: string | null;
    category: CategoryWithLocalization;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id, locale } = await params;
    return getBaseMetadata(locale, `/catalog/${id}`);
}

const getEmbedUrl = (url: string) => {
    if (!url) return "";

    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
        else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
        return `https://www.youtube.com/embed/${videoId}`;
    }

    // Google Drive
    if (url.includes("drive.google.com")) {
        return url.replace("/view", "/preview");
    }

    return url;
};

export default async function ProductPage({ params }: Props) {
    const { id, locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'productPage' });
    const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ivory.ge';
    const baseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
    const headerList = await headers();
    const nonce = headerList.get("x-nonce") ?? undefined;

    const product = await prisma.product.findFirst({
        where: { 
            id,
            deletedAt: null 
        },
        include: { category: true },
    });

    if (!product) {
        notFound();
    }

    // Parse images
    let images: string[] = [];
    try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) images = parsed;
    } catch {
        // Fallback for legacy data - check if image property exists
        const productWithImage = product as unknown as { image?: string };
        if (productWithImage.image) images = [productWithImage.image];
    }
    const typedProduct = product as ProductWithLocalization;
    const typedCategory = product.category as CategoryWithLocalization;

    // Localize fields
    const name = typedProduct[`name_${locale}` as keyof ProductWithLocalization] as string || product.name;
    const description = typedProduct[`description_${locale}` as keyof ProductWithLocalization] as string || product.description;
    const categoryName = typedCategory[`name_${locale}` as keyof CategoryWithLocalization] as string || product.category.name;

    return (
        <div className="container mx-auto px-4 py-8">
            <Link
                href="/catalog"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
                <ArrowLeft size={20} />
                {t('backToCatalog')}
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Image Gallery */}
                <ProductGallery images={images} name={name} />

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                            {categoryName}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                            {name}
                        </h1>
                        <p className="text-2xl font-bold text-foreground">
                            {formatPrice(product.price)}
                        </p>
                    </div>

                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                        <p>{description}</p>
                    </div>

                    {typedProduct.videoUrl && (
                        <div className="mt-8">
                            <h3 className="text-lg font-bold mb-4 font-serif">{t('videoOverview')}</h3>
                            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm border border-neutral-light">
                                <iframe
                                    src={getEmbedUrl(typedProduct.videoUrl)}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}

                    {/* Contact / Action */}
                    <div className="pt-6 border-t">
                        <Link
                            href="/contact"
                            className="w-full md:w-auto inline-flex justify-center items-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity"
                        >
                            {t('contactToRent')}
                        </Link>
                    </div>
                </div>
            </div>
            {/* Structured Data */}
            <script
                nonce={nonce}
                suppressHydrationWarning
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Product",
                        "name": name,
                        "image": images.map(img => img.startsWith('http') ? img : `${baseUrl}${img}`),
                        "description": description,
                        "offers": {
                            "@type": "Offer",
                            "price": product.price,
                            "priceCurrency": "GEL",
                            "availability": "https://schema.org/InStock"
                        }
                    })
                }}
            />
        </div>
    );
}
