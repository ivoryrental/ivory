import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const TRUSTED_FETCH_SITES = new Set(["same-origin", "same-site", "none"]);

function normalizeOrigin(value: string | null): string | null {
    if (!value) return null;
    try {
        const parsed = new URL(value);
        return `${parsed.protocol}//${parsed.host}`.toLowerCase();
    } catch {
        return null;
    }
}

function getAllowedOrigins(headerList: Headers): Set<string> {
    const allowed = new Set<string>();
    const isProduction = process.env.NODE_ENV === "production";

    const envSiteOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? null);
    if (envSiteOrigin) {
        allowed.add(envSiteOrigin);
    }

    // In production, trust explicit allowlist only.
    // Host headers can be spoofed in misconfigured proxy chains.
    if (!isProduction) {
        const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
        const proto = headerList.get("x-forwarded-proto") ?? "http";
        if (host) {
            allowed.add(`${proto}://${host}`.toLowerCase());
        }
    }

    const extraOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [];
    for (const origin of extraOrigins) {
        const normalized = normalizeOrigin(origin);
        if (normalized) {
            allowed.add(normalized);
        }
    }

    return allowed;
}

export function isSameOriginRequest(headerList: Headers): boolean {
    const secFetchSite = headerList.get("sec-fetch-site");
    if (secFetchSite && !TRUSTED_FETCH_SITES.has(secFetchSite.toLowerCase())) {
        return false;
    }

    const origin = normalizeOrigin(headerList.get("origin"));
    const referer = normalizeOrigin(headerList.get("referer"));

    if (!origin && !referer) {
        return false;
    }

    const allowedOrigins = getAllowedOrigins(headerList);
    return Boolean((origin && allowedOrigins.has(origin)) || (referer && allowedOrigins.has(referer)));
}

interface RequireAdminApiOptions {
    requireCsrf?: boolean;
}

export async function requireAdminApiAccess(
    request: Request,
    options: RequireAdminApiOptions = {}
): Promise<NextResponse | null> {
    const session = await verifySession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const method = request.method.toUpperCase();
    const shouldCheckCsrf = options.requireCsrf ?? !SAFE_METHODS.has(method);

    if (shouldCheckCsrf && !isSameOriginRequest(request.headers)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return null;
}
