import prisma from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { HomeContent } from "@/components/features/HomeContent";
import { getBaseMetadata } from "@/lib/metadata";
import { Metadata } from 'next';
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return getBaseMetadata(locale, '/');
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [settings, allCategories, services] = await Promise.all([
    getAllSettings(),
    prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        name_ka: true,
        name_ru: true,
        image: true,
      }
    }),
    prisma.service.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        title_ka: true,
        title_ru: true,
        description: true,
        description_ka: true,
        description_ru: true,
        images: true,
      }
    })
  ]);

  return <HomeContent settings={settings} allCategories={allCategories} services={services} />;
}
