"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";
import { Globe } from "lucide-react";
import { useSearchParams } from "next/navigation";

export function LanguageSwitcher({ preserveMobileMenu = false }: { preserveMobileMenu?: boolean }) {
    const [isPending, startTransition] = useTransition();
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: "ka", label: "GE" },
        { code: "en", label: "EN" },
        { code: "ru", label: "RU" },
    ];

    const onSelectChange = (nextLocale: string) => {
        startTransition(() => {
            // Include search parameters if any exist
            const currentParams = new URLSearchParams(searchParams.toString());
            if (preserveMobileMenu) {
                currentParams.set('mobileMenu', 'true');
            }

            const queryString = currentParams.toString();
            const targetPath = queryString ? `${pathname}?${queryString}` : pathname;

            router.replace(
                { pathname: targetPath },
                { locale: nextLocale, scroll: false }
            );
            router.refresh();
        });
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-text-main hover:text-primary transition-colors uppercase"
            >
                <Globe size={18} />
                {locale}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-popover border border-border shadow-lg rounded-md overflow-hidden z-50 min-w-[80px]">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            disabled={isPending}
                            onClick={() => onSelectChange(lang.code)}
                            className={cn(
                                "block w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors",
                                locale === lang.code ? "font-bold text-primary" : "text-foreground"
                            )}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
