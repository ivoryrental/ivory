import { getAllSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getTranslations } from "next-intl/server";
import prisma from "@/lib/prisma";

export default async function AdminSettingsPage() {
    const [t, settings, categories] = await Promise.all([
        getTranslations("adminSettings"),
        getAllSettings(),
        prisma.category.findMany({
            where: { deletedAt: null },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
                id: true,
                name: true,
                name_ka: true,
                name_ru: true,
                slug: true,
                image: true,
            }
        })
    ]);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold font-serif text-foreground">{t('title')}</h1>
            <SettingsForm initialSettings={settings} categories={categories} />
        </div>
    );
}
