/* eslint-disable @next/next/no-img-element */
import prisma from "@/lib/prisma";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ThemeLink as Link } from "@/components/ui/ThemeLink";
import { getBaseMetadata } from "@/lib/metadata";
import { Metadata } from 'next';
import { transformImageLink } from "@/lib/utils";

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
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    return getBaseMetadata(locale, '/services');
}

export default async function ServicesPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('common');

    const services = await prisma.service.findMany({
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });

    const getLocalizedContent = (service: ServiceWithLocalization, field: 'title' | 'description') => {
        const localizedField = `${field}_${locale}` as keyof ServiceWithLocalization;
        const localized = service[localizedField] as string | null | undefined;
        // Fallback to English (default field) if localized is missing
        return localized || service[field];
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-serif font-bold text-primary mb-6">{t('services')}</h1>
            <div className="space-y-12">
                {services.map((service) => {
                    let images: string[] = [];
                    try {
                        if (service.images) {
                            images = JSON.parse(service.images);
                        }
                    } catch (e) {
                        console.error("Failed to parse images for service", service.id, e);
                    }

                    const displayImage = images.length > 0 ? images[0] : null;

                    return (
                        <Link key={service.id} href={`/services/${service.id}`} className="block group">
                            <div className="flex flex-col md:flex-row gap-8 items-center bg-card p-8 rounded-xl border border-border shadow-sm group-hover:shadow-md transition-all">
                                <div className="w-full md:w-1/3 aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground overflow-hidden">
                                    {displayImage ? (
                                        <img 
                                            src={transformImageLink(displayImage)} 
                                            alt={getLocalizedContent(service, 'title')} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                            </div>
                                            <span>No Image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{getLocalizedContent(service, 'title')}</h3>
                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-3">
                                        {getLocalizedContent(service, 'description')}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
            {services.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No services found.
                </div>
            )}
        </div>
    );
}
