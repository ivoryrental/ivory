import { ContactClient } from "./ContactClient";
import { getBaseMetadata } from "@/lib/metadata";
import { Metadata } from 'next';
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    return getBaseMetadata(locale, '/contact');
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <ContactClient />;
}
