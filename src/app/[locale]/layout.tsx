import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { getAllSettings } from "@/lib/settings";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { Cart } from "@/components/features/Cart";
import { NatureBackground } from "@/components/layout/NatureBackground";
import { FaviconAnimator } from "@/components/layout/FaviconAnimator";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap",
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
});

export const viewport = {
    width: "device-width",
    initialScale: 1,
};

import { getBaseMetadata, baseUrl } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const baseMetadata = getBaseMetadata(locale, '/');

    return {
        ...baseMetadata,
        title: {
            template: "%s | IVORY",
            default: "IVORY — Inventory Rental",
        },
        description: "Luxury inventory rental for weddings and events. Decor, furniture like no other.",
        openGraph: {
            ...baseMetadata.openGraph,
            title: "IVORY — Inventory Rental",
            description: "Turn your event into an unforgettable memory.",
        },
        icons: {
            icon: "/icon.svg?v=2",
            apple: "/icon.svg?v=2",
        },
        manifest: "/manifest.json",
    };
}

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    // Ensuring that the incoming `locale` is valid
    if (!['en', 'ka', 'ru'].includes(locale)) {
        notFound();
    }

    setRequestLocale(locale);
    const [messages, settings, headerList] = await Promise.all([
        getMessages(),
        getAllSettings(),
        headers(),
    ]);
    const nonce = headerList.get("x-nonce") ?? undefined;

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider nonce={nonce}>
                        <SettingsProvider settings={settings}>
                            <CartProvider>
                                <NatureBackground />
                                <FaviconAnimator />
                                <Header />
                                <main className="flex-1 pt-20 md:pt-24 pb-16 relative z-10">
                                    {children}
                                </main>
                                <Footer />
                                <Cart />
                                <script
                                    nonce={nonce}
                                    suppressHydrationWarning
                                    type="application/ld+json"
                                    dangerouslySetInnerHTML={{
                                        __html: JSON.stringify({
                                            "@context": "https://schema.org",
                                            "@type": "Organization",
                                            "name": "IVORY",
                                            "url": baseUrl,
                                            "logo": `${baseUrl}/icon.svg`,
                                            "description": "Luxury inventory rental for weddings and events in Georgia."
                                        })
                                    }}
                                />
                            </CartProvider>
                        </SettingsProvider>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
