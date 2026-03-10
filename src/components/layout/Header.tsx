"use client";

import { useState, useEffect, useTransition } from "react";
import { ThemeLink as Link } from "@/components/ui/ThemeLink";
import { Menu, X, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { useSettings } from "@/components/providers/SettingsProvider";

const PublicHeader = ({ pathname }: { pathname: string }) => {
    const t = useTranslations('common');
    const settings = useSettings();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [, startTransition] = useTransition();

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (searchParams.get('mobileMenu') === 'true') {
            startTransition(() => {
                setIsMobileMenuOpen(true);
            });
        }
    }, [searchParams, startTransition]);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    const handleMenuClose = () => {
        setIsMobileMenuOpen(false);
        const params = new URLSearchParams(searchParams.toString());
        if (params.has('mobileMenu')) {
            params.delete('mobileMenu');
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    };

    const navLinks = [
        { href: "/catalog", label: t('catalog') },
        { href: "/services", label: t('services') },
        { href: "/about", label: t('about') },
        { href: "/contact", label: t('contact') },
    ];

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
                    isScrolled || isMobileMenuOpen
                        ? "bg-background/95 backdrop-blur-md py-3 shadow-sm border-b border-border"
                        : "bg-transparent py-5"
                )}
            >
                <div className="container mx-auto px-4 flex items-center justify-between gap-4">
                    <Link href="/" className="z-50 relative group flex-shrink-0">
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <Logo className="w-8 h-8 md:w-10 md:h-10 text-[#C26196] transition-transform group-hover:rotate-12" />
                            <span className={cn(
                                "font-serif text-xl md:text-2xl font-bold tracking-tight text-[#C26196]",
                                isScrolled ? "opacity-100" : "opacity-100 transition-opacity"
                            )}>
                                IVORY
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden xl:flex items-center gap-4 xl:gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-foreground/80 hover:text-primary font-medium transition-colors text-xs xl:text-sm uppercase tracking-wider whitespace-nowrap"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2 lg:gap-3 lg:ml-4 lg:border-l lg:pl-6 border-neutral-light/30">
                        <a
                            href={`tel:${settings.contact.phone}`}
                            className="hidden md:flex items-center gap-2 px-3 py-2 lg:px-5 lg:py-2.5 bg-[#C26196] text-white rounded-full font-medium hover:bg-[#C26196]/90 transition-all shadow-md shadow-[#C26196]/20 whitespace-nowrap text-sm lg:text-base"
                        >
                            <Phone size={14} className="lg:w-[16px] lg:h-[16px]" />
                            <span className="hidden xl:inline">{t('contactBtn')}</span>
                            <span className="xl:hidden">{t('contact')}</span>
                        </a>
                        <ThemeToggle />
                        <LanguageSwitcher />
                    </div>

                    <div className="flex items-center gap-2 xl:hidden z-[1001]">
                        <button
                            className="p-1.5 text-[#C26196]"
                            onClick={() => isMobileMenuOpen ? handleMenuClose() : setIsMobileMenuOpen(true)}
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 bg-background w-full h-full z-[1000] flex flex-col"
                    >
                        <div className="flex items-center justify-end p-6 pt-8 md:pt-6 border-b border-border/10">
                            <button
                                onClick={handleMenuClose}
                                className="p-2 bg-background/50 rounded-full text-foreground hover:text-primary transition-colors"
                            >
                                <X size={32} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-10 pb-16 flex flex-col pt-10">
                            <nav className="flex flex-col gap-10">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={handleMenuClose}
                                        className="text-4xl font-serif font-bold text-foreground border-b border-border pb-6"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>

                            <div className="mt-auto pt-16 space-y-4">
                                <p className="text-muted-foreground text-sm uppercase tracking-widest font-black">{t('contactUs')}</p>
                                <a href={`tel:${settings.contact.phone}`} className="flex items-center gap-4 text-3xl font-bold text-primary">
                                    <Phone size={30} />
                                    {settings.contact.phone}
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export const Header = () => {
    const pathname = usePathname() ?? "";

    if (pathname.includes("/admin")) {
        return null;
    }

    return <PublicHeader pathname={pathname} />;
};
