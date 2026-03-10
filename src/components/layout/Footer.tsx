"use client";

import { ThemeLink as Link } from "@/components/ui/ThemeLink";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useTranslations, useLocale } from "next-intl";
import { useSettings } from "@/components/providers/SettingsProvider";
import { SupportedLocale } from "@/lib/settings-shared";
import { usePathname } from "next/navigation";

const PublicFooter = () => {
    const t = useTranslations();
    const settings = useSettings();
    const locale = useLocale() as SupportedLocale;

    return (
        <footer className="bg-secondary/50 pt-20 pb-10 border-t border-border relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 relative z-10">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="inline-block mb-6">
                            <div className="flex items-center gap-3">
                                <Logo className="w-12 h-12 text-primary" />
                                <span className="font-serif text-3xl font-bold text-primary">IVORY</span>
                            </div>
                        </Link>
                        <p className="text-gray-600 max-w-sm leading-relaxed mb-6">
                            {t('footer.description')}
                        </p>
                        <div className="flex gap-4">
                            {settings.social?.facebook && (
                                <a href={settings.social.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-neutral-light flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
                                    <Facebook size={20} />
                                </a>
                            )}
                            {settings.social?.instagram && (
                                <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-neutral-light flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
                                    <Instagram size={20} />
                                </a>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-foreground mb-6 uppercase tracking-wider text-sm">{t('common.navigation')}</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            <li><Link href="/catalog" className="hover:text-primary transition-colors">{t('common.catalog')}</Link></li>
                            <li><Link href="/services" className="hover:text-primary transition-colors">{t('common.services')}</Link></li>
                            <li><Link href="/about" className="hover:text-primary transition-colors">{t('common.about')}</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">{t('common.contact')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-foreground mb-6 uppercase tracking-wider text-sm">{t('common.contact')}</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-primary shrink-0" />
                                <a href={`tel:${settings.contact.phone}`} className="hover:text-primary transition-colors">{settings.contact.phone}</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-primary shrink-0" />
                                <a href={`mailto:${settings.contact.email}`} className="hover:text-primary transition-colors break-all">{settings.contact.email}</a>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-primary shrink-0 mt-1" />
                                <span>{settings.contact.address[locale]}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
                    <p>(c) {new Date().getFullYear()} IVORY. {t('common.rightsReserved')}.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Link href="/privacy" className="hover:text-foreground">{t('common.privacy')}</Link>
                        <Link href="/terms" className="hover:text-foreground">{t('common.terms')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export const Footer = () => {
    const pathname = usePathname() ?? "";

    if (pathname.includes("/admin")) {
        return null;
    }

    return <PublicFooter />;
};
