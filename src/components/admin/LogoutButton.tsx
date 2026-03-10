"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { logout } from "@/app/actions/auth";
import { useRouter } from "@/i18n/routing";

export function LogoutButton() {
    const t = useTranslations("admin");
    const router = useRouter();

    async function handleLogout() {
        await logout();
        router.replace("/admin/login");
    }

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
            <LogOut size={20} />
            {t("logout")}
        </button>
    );
}
