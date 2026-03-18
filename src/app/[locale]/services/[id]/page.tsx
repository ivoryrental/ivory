import { notFound } from "next/navigation";
import { ThemeLink as Link } from "@/components/ui/ThemeLink";
import prisma from "@/lib/prisma";
import { ArrowLeft, Phone } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductGallery } from "@/components/features/ProductGallery";
import { getAllSettings } from "@/lib/settings";
import { getBaseMetadata, getRenderedSocialImageUrl } from "@/lib/metadata";
import { Metadata } from 'next';
import { safeJsonParse } from "@/lib/utils";

interface Props {
    params: Promise<{ id: string; locale: string }>;
}

interface ServiceWithLocalization {
    id: string;
    title: string;
    title_ka?: string | null;
    title_ru?: string | null;
    description: string;
    description_ka?: string | null;
    description_ru?: string | null;
    images: string;
    videoUrl?: string | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id, locale } = await params;
    const service = await prisma.service.findFirst({
        where: {
            id,
            deletedAt: null
        },
        select: {
            title: true,
            title_ka: true,
            title_ru: true,
            description: true,
            description_ka: true,
            description_ru: true,
            images: true,
        }
    });

    if (!service) {
        return getBaseMetadata(locale, `/services/${id}`);
    }

    const localizedTitle =
        (service[`title_${locale}` as keyof typeof service] as string | null | undefined) || service.title;
    const localizedDescription =
        (service[`description_${locale}` as keyof typeof service] as string | null | undefined) || service.description;
    const images = safeJsonParse<string[]>(service.images, []);
    const imageUrl = getRenderedSocialImageUrl(images[0]);
    const baseMetadata = getBaseMetadata(locale, `/services/${id}`, {
        title: localizedTitle,
        description: localizedDescription,
        imageAlt: localizedTitle,
    });

    return {
        ...baseMetadata,
        openGraph: {
            ...baseMetadata.openGraph,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: localizedTitle,
                },
            ],
        },
        twitter: {
            ...baseMetadata.twitter,
            images: [imageUrl],
        },
    };
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

export default async function ServicePage({ params }: Props) {
    const { id, locale } = await params;
    setRequestLocale(locale);
    const [tCommon, tProduct, settings, service] = await Promise.all([
        getTranslations({ locale, namespace: 'common' }),
        getTranslations({ locale, namespace: 'productPage' }),
        getAllSettings(),
        prisma.service.findFirst({
            where: {
                id,
                deletedAt: null
            },
            select: {
                id: true,
                title: true,
                title_ka: true,
                title_ru: true,
                description: true,
                description_ka: true,
                description_ru: true,
                images: true,
                videoUrl: true,
            }
        })
    ]);

    if (!service) {
        notFound();
    }

    const typedService = service as ServiceWithLocalization;

    // Parse images
    let images: string[] = [];
    try {
        const parsed = JSON.parse(service.images);
        if (Array.isArray(parsed)) images = parsed;
    } catch {
        // No fallback image field on Service model based on schema? 
        // Schema says: images String @default("[]").
    }

    // Localize fields
    const title = typedService[`title_${locale}` as keyof ServiceWithLocalization] as string || service.title;
    const description = typedService[`description_${locale}` as keyof ServiceWithLocalization] as string || service.description;

    return (
        <div className="container mx-auto px-4 py-8">
            <Link
                href="/services"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
                <ArrowLeft size={20} />
                {tCommon('services')} {/* "Services" or "Back to Services" if I had it. Using "Services" as breadcrumb is ok-ish */}
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Image Gallery - Reusing ProductGallery as filter/slider works for any string[] */}
                <ProductGallery images={images} name={title} />

                {/* Service Info */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                            {title}
                        </h1>
                    </div>

                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap">{description}</p>
                    </div>

                    {typedService.videoUrl && (
                        <div className="mt-8">
                            <h3 className="text-lg font-bold mb-4 font-serif">{tProduct('videoOverview')}</h3>
                            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm border border-neutral-light">
                                <iframe
                                    src={getEmbedUrl(typedService.videoUrl)}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}

                    {/* Contact / Action */}
                    <div className="pt-6 border-t">
                        <a
                            href={`tel:${settings.contact.phone}`}
                            className="w-full md:w-auto inline-flex justify-center items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity"
                        >
                            <Phone size={20} />
                            {tCommon('contactBtn')}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
