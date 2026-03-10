"use client";

import { usePathname } from "@/i18n/routing";
import { ThemeLink as Link } from "@/components/ui/ThemeLink";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Package, CalendarRange, Settings, Briefcase, Tags, History, Trash2 } from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { cn } from "@/lib/utils";

interface SidebarProps {
    className?: string;
    onClose?: () => void;
}

export const Sidebar = ({ className, onClose }: SidebarProps) => {
    const t = useTranslations("admin");
    const pathname = usePathname();

    // Strip locale from pathname for comparison (e.g. /en/admin -> /admin)
    const pathnameWithoutLocale = pathname.replace(/^\/(en|ka|ru)/, '') || '/';

    const isActive = (href: string) => {
        // Handle exact match for dashboard
        if (href === "/admin") {
            return pathnameWithoutLocale === "/admin";
        }
        // Handle exact match for history page
        if (href === "/admin/bookings/history") {
            return pathnameWithoutLocale === "/admin/bookings/history";
        }
        // Handle bookings page - should NOT be active when on history page
        if (href === "/admin/bookings") {
            return pathnameWithoutLocale === "/admin/bookings" || 
                   (pathnameWithoutLocale.startsWith("/admin/bookings") && 
                    !pathnameWithoutLocale.startsWith("/admin/bookings/history"));
        }
        // Handle sub-routes
        return pathnameWithoutLocale.startsWith(href);
    };

    const links = [
        { href: "/admin", label: t("dashboard"), icon: LayoutDashboard },
        { href: "/admin/products", label: t("products"), icon: Package },
        { href: "/admin/categories", label: t("categories"), icon: Tags },
        { href: "/admin/services", label: t("services"), icon: Briefcase },
        { href: "/admin/bookings", label: t("bookings"), icon: CalendarRange },
        { href: "/admin/bookings/history", label: t("history"), icon: History },
        { href: "/admin/trash", label: t("trash"), icon: Trash2 },
        { href: "/admin/settings", label: t("settings"), icon: Settings },
    ];

    return (
        <aside className={cn("w-64 bg-card border-r border-border flex flex-col h-full", className)}>
            <div className="p-6 border-b border-border flex items-center justify-between">
                <h1 className="text-xl font-serif font-bold text-primary">IVORY Admin</h1>
                {onClose && (
                    <button onClick={onClose} className="md:hidden p-2 hover:bg-muted rounded-full">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                    </button>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {links.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        onClick={onClose}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                            isActive(href)
                                ? "text-foreground bg-muted" // Active styles
                                : "text-muted-foreground hover:bg-muted" // Inactive styles
                        )}
                    >
                        <Icon size={20} />
                        {label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-border mt-auto">
                <LogoutButton />
            </div>
        </aside>
    );
};
