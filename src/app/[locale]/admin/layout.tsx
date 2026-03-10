"use client";

import { Sidebar } from "@/components/admin/Sidebar";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export default function AdminLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const t = useTranslations();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-foreground -mt-20 md:-mt-24 -mb-16">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col w-64 border-r border-border h-full">
                <Sidebar className="w-full border-none" />
            </div>

            {/* Mobile Sidebar Drawer */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                    {/* Sidebar Content */}
                    <div className="relative w-64 h-full bg-background shadow-xl animate-in slide-in-from-left duration-200">
                        <Sidebar
                            className="w-full h-full border-none"
                            onClose={() => setIsSidebarOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 hover:bg-muted rounded-full"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-lg font-medium">{t('admin.overview')}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <LanguageSwitcher />
                        <AdminNotifications />
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            AD
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
                    {children}
                </main>
            </div>
        </div>
    );
}
