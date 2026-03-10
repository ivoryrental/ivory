import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllSettings } from "@/lib/settings";
import { SupportedLocale } from "@/lib/settings-shared";
import { getBaseMetadata } from "@/lib/metadata";
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    return getBaseMetadata(locale, '/terms');
}

export default async function TermsPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const localeKey = locale as SupportedLocale;
    const [settings, commonT] = await Promise.all([
        getAllSettings(),
        getTranslations('common')
    ]);

    const content = settings.policies?.terms?.[localeKey] || "";

    return (
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-12 border-b border-border pb-6">
                {commonT('terms')}
            </h1>

            <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {content ? (
                    content
                ) : (
                    <div className="italic text-muted-foreground/50">
                        Content is being updated. please check back later.
                    </div>
                )}
            </div>
        </div>
    );
}
