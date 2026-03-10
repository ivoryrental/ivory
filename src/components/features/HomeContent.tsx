"use client";
/* eslint-disable @next/next/no-img-element */

import { ThemeLink as Link } from "@/components/ui/ThemeLink";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { SlideUp, ScaleIn, FadeIn } from "@/components/ui/MotionWrappers";
import { useTranslations, useLocale } from "next-intl";
import { SupportedLocale } from "@/lib/settings-shared";
import { transformImageLink } from "@/lib/utils";

interface Category {
    id: string;
    slug: string;
    name: string;
    name_ka?: string | null;
    name_ru?: string | null;
    image: string | null;
}

interface LocalizedValue {
    en: string;
    ka: string;
    ru: string;
}

interface HeroSettings {
    mainImage?: string;
    secondaryImage?: string;
    title: LocalizedValue;
    subtitle: LocalizedValue;
    text: LocalizedValue;
}

interface PopularCategoriesConfig {
    config?: { slug: string; image: string }[] | string;
}

interface AppSettings {
    hero: HeroSettings;
    popularCategories?: PopularCategoriesConfig;
}

interface Service {
    id: string;
    title: string;
    title_ka?: string | null;
    title_ru?: string | null;
    description: string;
    description_ka?: string | null;
    description_ru?: string | null;
    images?: string;
    image?: string;
}

interface DisplayCategory {
    title: string;
    img: string;
    slug: string;
}

interface HomeContentProps {
    settings: AppSettings;
    allCategories: Category[];
    services: Service[];
}

export function HomeContent({ settings, allCategories, services }: HomeContentProps) {
    const t = useTranslations('home');
    const cat = useTranslations('categories');
    const servicesT = useTranslations('services');
    const commonT = useTranslations('common');
    const locale = useLocale() as SupportedLocale;

    // Helper to get localized content
    const getLoc = (item: Service, field: 'title' | 'description') => {
        return item[`${field}_${locale}` as keyof Service] as string | undefined || item[field] || '';
    };

    return (
        <div className="flex flex-col gap-10 md:gap-24 relative overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-10 md:pt-16 pb-10 md:pb-0">

                <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    {/* Text Content */}
                    <div className="flex-1 text-center md:text-left pt-2 md:pt-0 relative z-10">
                        <SlideUp delay={0.2} className="inline-block">
                            <span className="text-primary tracking-[0.2em] font-bold uppercase mb-4 block text-sm md:text-base">
                                {settings.hero.subtitle[locale]}
                            </span>
                        </SlideUp>

                        <SlideUp delay={0.3}>
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-[#C26196] tracking-tight mb-2 font-serif">
                                {settings.hero.title[locale]}
                            </h1>
                        </SlideUp>

                        <SlideUp delay={0.5}>
                            <p className="text-lg md:text-xl text-text-main/80 max-w-md mb-10 leading-relaxed mx-auto md:mx-0 font-medium">
                                {settings.hero.text[locale]}
                            </p>
                        </SlideUp>

                        <SlideUp delay={0.6}>
                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center md:justify-start">
                                <Link
                                    href="/catalog"
                                    className="group px-8 py-4 bg-primary text-white rounded-none font-medium text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 border-2 border-primary relative overflow-hidden"
                                >
                                    <span className="relative z-10">{commonT('catalog')}</span>
                                    <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                </Link>
                                <Link
                                    href="/contact"
                                    className="px-8 py-4 bg-transparent text-primary border-2 border-primary rounded-none font-medium text-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                                >
                                    {commonT('contact')}
                                </Link>
                            </div>
                        </SlideUp>
                    </div>

                    {/* Hero Image Collage */}
                    <div className="flex-1 relative w-full aspect-[4/5] md:aspect-square max-w-[600px] flex items-center justify-center z-10">

                        {/* Background Blob */}
                        <FadeIn delay={0} duration={1} className="absolute inset-0 bg-accent/20 rounded-full blur-3xl transform scale-75 z-0">
                            <div className="w-full h-full" />
                        </FadeIn>

                        {/* Main Polaroid */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotate: 15, y: -50 }}
                            animate={{ opacity: 1, scale: 1, rotate: 6, y: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
                            className="relative w-[80%] aspect-[3/4] bg-white p-3 md:p-4 shadow-2xl z-10 transform origin-bottom-right mb-10 ml-auto mr-0 md:mr-8"
                        >
                            <div className="w-full h-full relative overflow-hidden bg-neutral-100">
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent z-10 pointer-events-none mix-blend-overlay" />
                                <img
                                    src={transformImageLink(settings.hero.mainImage || "") || "/images/hero-bg.png"}
                                    alt="Luxury Event Decor"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                        </motion.div>

                        {/* Secondary Polaroid */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotate: -20, y: 50 }}
                            animate={{ opacity: 1, scale: 1, rotate: -8, y: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.5 }}
                            className="absolute -bottom-6 -left-6 md:-left-2 w-[55%] aspect-square bg-white p-3 shadow-xl z-20 transform origin-top-left"
                        >
                            <div className="w-full h-full relative overflow-hidden bg-neutral-100">
                                <div className="absolute inset-0 bg-gradient-to-bl from-black/10 to-transparent z-10 pointer-events-none mix-blend-overlay" />
                                <img
                                    src={transformImageLink(settings.hero.secondaryImage || "") || "/images/cat-furniture.png"}
                                    alt="Detail"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Featured Categories Preview */}
            <section className="container mx-auto px-4 md:px-6 relative py-12">
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-text-main font-serif">{t('popularCategories')}</h2>
                    <Link href="/catalog" className="text-primary font-medium hover:underline flex items-center gap-1">
                        {t('viewAll')} <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
                    {(function () {
                        // Logic to determine categories to display
                        let displayItems = [];

                        try {
                            if (settings.popularCategories?.config) {
                                const config = typeof settings.popularCategories.config === 'string'
                                    ? JSON.parse(settings.popularCategories.config)
                                    : settings.popularCategories.config;

                                // Filter out empty slots
                                displayItems = config
                                    .filter((slot: { slug?: string }) => slot.slug)
                                    .map((slot: { slug: string; image?: string }) => {
                                        const dbCat = allCategories.find((c) => c.slug === slot.slug);
                                        if (!dbCat) return null;

                                        const title = dbCat[`name_${locale}` as keyof Category] as string | undefined || dbCat.name;

                                        return {
                                            title: title,
                                            img: slot.image || dbCat.image || "/images/placeholder.png",
                                            slug: slot.slug
                                        };
                                    })
                                    .filter(Boolean);
                            }
                        } catch (e) {
                            console.error("Failed to parse popular categories", e);
                        }

                        // Fallback if no config or empty
                        if (displayItems.length === 0) {
                            // Only use hardcoded fallback if everything else fails
                            displayItems = [
                                { title: cat('tableware'), img: "/images/cat-tableware.png", slug: "tableware" },
                                { title: cat('furniture'), img: "/images/cat-furniture.png", slug: "furniture" },
                                { title: cat('decor'), img: "/images/cat-decor.png", slug: "decor" },
                                { title: cat('textile'), img: "/images/cat-textile.png", slug: "textile" }
                            ];
                        }

                        return displayItems.map((category: DisplayCategory, i: number) => (
                            <ScaleIn key={i} delay={i * 0.1} className="group cursor-pointer">
                                <Link href={`/catalog?category=${category.slug}`} className="block">
                                    <div className="aspect-square bg-neutral-100 mb-3 overflow-hidden border border-neutral-light/50 group-hover:shadow-md transition-all relative">
                                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors z-10" />
                                        <img
                                            src={transformImageLink(category.img)}
                                            alt={category.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            referrerPolicy="no-referrer"
                                        />
                                    </div>
                                    <h3 className="font-semibold text-text-main group-hover:text-primary transition-colors text-center font-serif">{category.title}</h3>
                                </Link>
                            </ScaleIn>
                        ));
                    })()}
                </div>
            </section>

            {/* Services Preview Section */}
            <section className="container mx-auto px-4 py-20 bg-secondary/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                <SlideUp className="text-center mb-16 relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold font-serif text-text-main mb-4">{t('ourServices')}</h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        {t('servicesDesc')}
                    </p>
                </SlideUp>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {services.length > 0 ? (
                        services.map((service, i) => {
                            let images = [];
                            try {
                                images = service.images ? JSON.parse(service.images) : (service.image ? [service.image] : []);
                            } catch { images = []; }
                            const mainImage = images[0];

                            return (
                                <SlideUp key={service.id} delay={i * 0.2}>
                                    <div className="group p-8 border border-border bg-card hover:bg-card/80 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative overflow-hidden h-full rounded-xl">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/20 transition-colors" />

                                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-primary mb-6 shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
                                            {mainImage ? (
                                                <img
                                                    src={transformImageLink(mainImage)}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 bg-primary/20 rounded-full" />
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-card-foreground mb-3 font-serif group-hover:text-primary transition-colors">
                                            {getLoc(service, 'title')}
                                        </h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                            {getLoc(service, 'description')}
                                        </p>

                                        <Link href="/services" className="inline-flex items-center gap-2 text-primary font-medium text-sm hover:gap-3 transition-all mt-auto">
                                            {commonT('services')} <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </SlideUp>
                            );
                        })
                    ) : (
                        [
                            { title: servicesT('decor.title'), desc: servicesT('decor.desc') },
                            { title: servicesT('catering.title'), desc: servicesT('catering.desc') },
                            { title: servicesT('transport.title'), desc: servicesT('transport.desc') }
                        ].map((service, i) => (
                            <SlideUp key={i} delay={i * 0.2}>
                                <div className="group p-8 border border-border bg-card hover:bg-card/80 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative overflow-hidden h-full rounded-xl">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/20 transition-colors" />

                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-primary mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                        <div className="w-6 h-6 bg-primary/20 rounded-full" />
                                    </div>

                                    <h3 className="text-xl font-bold text-card-foreground mb-3 font-serif group-hover:text-primary transition-colors">{service.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">{service.desc}</p>

                                    <Link href="/services" className="inline-flex items-center gap-2 text-primary font-medium text-sm hover:gap-3 transition-all mt-auto">
                                        {commonT('services')} <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </SlideUp>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
