"use server";

import { headers } from "next/headers";
import { updateSettings } from "@/lib/settings";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/auth";
import { isSameOriginRequest } from "@/lib/request-security";

const ALLOWED_SECTIONS = new Set([
    "contact",
    "social",
    "hero",
    "about",
    "policies",
    "popularCategories",
]);
const SUPPORTED_LOCALES = ["en", "ka", "ru"] as const;
const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);
const LOCALIZED_STATIC_ROUTES = ["", "/about", "/contact", "/privacy", "/terms"] as const;

function revalidatePublicSettingsPages() {
    revalidatePath("/");

    for (const locale of SUPPORTED_LOCALES) {
        for (const route of LOCALIZED_STATIC_ROUTES) {
            revalidatePath(`/${locale}${route}`);
        }
    }
}

function normalizeFormValue(value: FormDataEntryValue): string {
    return typeof value === "string" ? value.trim() : "";
}

export async function saveSettingsAction(formData: FormData) {
    const session = await verifySession();
    if (!session) {
        return { success: false, message: "Unauthorized" };
    }

    const headerList = await headers();
    if (!isSameOriginRequest(headerList)) {
        return { success: false, message: "Invalid request origin" };
    }

    const settings: Record<string, Record<string, unknown>> = {};

    // Group form data by section (e.g., hero.title.en)
    for (const [key, value] of formData.entries()) {
        if (key.startsWith("$ACTION")) continue; // Skip Next.js internal fields

        const parts = key.split(".");
        if (parts.length < 2) continue;

        const section = parts[0];
        if (!ALLOWED_SECTIONS.has(section)) continue;

        const field = parts[1];
        const safeValue = normalizeFormValue(value);
        if (safeValue.length > 10000) {
            return { success: false, message: `Value too long for field ${key}` };
        }

        if (!settings[section]) settings[section] = {};

        if (parts.length === 3) {
            // Handle localized fields: section.field.lang e.g., hero.title.en
            const lang = parts[2];
            if (!SUPPORTED_LOCALE_SET.has(lang)) continue;
            const localized = (settings[section][field] as Record<string, string> | undefined) ?? {};
            localized[lang] = safeValue;
            settings[section][field] = localized;
        } else {
            // Handle simple fields: section.field e.g., contact.phone
            settings[section][field] = safeValue;
        }
    }

    // Save each section individually
    for (const section in settings) {
        await updateSettings(section, settings[section]);
    }

    revalidatePublicSettingsPages();
    return { success: true, message: "Settings saved." };
}
