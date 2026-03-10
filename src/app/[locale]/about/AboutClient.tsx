"use client";

import { useTranslations, useLocale } from "next-intl";
import { useSettings } from "@/components/providers/SettingsProvider";
import { SupportedLocale } from "@/lib/settings-shared";

export function AboutClient() {
    const t = useTranslations('about');
    const settings = useSettings();
    const locale = useLocale() as SupportedLocale;

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-serif font-bold text-primary mb-8 text-center">{t('title')}</h1>

            <div className="bg-card p-8 rounded-xl border border-border shadow-md mb-12">
                <p className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                    {settings.about.text[locale]}
                </p>
            </div>
        </div>
    );
}
