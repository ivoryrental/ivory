import { AboutClient } from "./AboutClient";
import { getBaseMetadata } from "@/lib/metadata";
import { Metadata } from 'next';
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    return getBaseMetadata(locale, '/about');
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <AboutClient />;
}
