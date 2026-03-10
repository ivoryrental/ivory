import prisma from "@/lib/prisma";
import { DEFAULT_SETTINGS } from "@/lib/settings-shared";
import { revalidateTag, unstable_cache } from "next/cache";

const SETTINGS_CACHE_TAG = "global-settings";

async function fetchAllSettingsFromDb(): Promise<typeof DEFAULT_SETTINGS> {
    try {
        const settings = await prisma.globalSettings.findMany();

        const result: Record<string, unknown> = {};

        settings.forEach((s) => {
            try {
                result[s.key] = JSON.parse(s.value);
            } catch {
                result[s.key] = null;
            }
        });

        return deepMerge(DEFAULT_SETTINGS, result) as typeof DEFAULT_SETTINGS;
    } catch {
        console.error("Failed to fetch all settings");
        return DEFAULT_SETTINGS;
    }
}

const getCachedAllSettings = unstable_cache(fetchAllSettingsFromDb, ["all-settings"], {
    tags: [SETTINGS_CACHE_TAG],
    revalidate: 300,
});

export async function getAllSettings(): Promise<typeof DEFAULT_SETTINGS> {
    return getCachedAllSettings();
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            const sourceValue = source[key];
            if (isObject(sourceValue)) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: sourceValue });
                } else {
                    const targetValue = target[key] as Record<string, unknown>;
                    output[key] = deepMerge(targetValue, sourceValue);
                }
            } else {
                Object.assign(output, { [key]: sourceValue });
            }
        });
    }
    return output;
}

function isObject(item: unknown): item is Record<string, unknown> {
    return (item !== null && typeof item === 'object' && !Array.isArray(item));
}

export async function updateSettings(key: string, value: unknown) {
    await prisma.globalSettings.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
    });
    revalidateTag(SETTINGS_CACHE_TAG, "max");
}
