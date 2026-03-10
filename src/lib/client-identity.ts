const PRODUCTION_TRUSTED_IP_HEADERS = [
    "x-vercel-forwarded-for",
    "cf-connecting-ip",
    "x-real-ip",
] as const;

const DEVELOPMENT_TRUSTED_IP_HEADERS = [
    ...PRODUCTION_TRUSTED_IP_HEADERS,
    "x-forwarded-for",
] as const;

function normalizeHeaderToken(value: string | null, maxLength: number): string {
    if (!value) return "na";

    const normalized = value
        .toLowerCase()
        .replace(/[^a-z0-9 ._/:;-]/g, "")
        .trim()
        .slice(0, maxLength);

    return normalized || "na";
}

function isValidIpv4(ip: string): boolean {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;

    return parts.every((part) => {
        if (!/^\d{1,3}$/.test(part)) return false;
        const value = Number(part);
        return value >= 0 && value <= 255;
    });
}

function isLikelyIpv6(ip: string): boolean {
    return ip.includes(":") && /^[0-9a-f:]+$/i.test(ip);
}

function normalizeIpCandidate(rawValue: string): string | null {
    const trimmed = rawValue.trim().replace(/^"|"$/g, "");
    if (!trimmed) return null;

    const bracketedMatch = trimmed.match(/^\[([0-9a-fA-F:]+)\](?::\d+)?$/);
    if (bracketedMatch?.[1] && isLikelyIpv6(bracketedMatch[1])) {
        return bracketedMatch[1].toLowerCase();
    }

    const ipv4WithOptionalPortMatch = trimmed.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/);
    if (ipv4WithOptionalPortMatch?.[1] && isValidIpv4(ipv4WithOptionalPortMatch[1])) {
        return ipv4WithOptionalPortMatch[1];
    }

    if (isLikelyIpv6(trimmed)) {
        return trimmed.toLowerCase();
    }

    return null;
}

function extractIpFromHeader(headerValue: string | null): string | null {
    if (!headerValue) return null;

    const candidates = headerValue
        .split(",")
        .map((value) => normalizeIpCandidate(value))
        .filter((value): value is string => Boolean(value));

    return candidates[0] ?? null;
}

function getClientIpFromHeaders(headerList: Headers): string | null {
    const trustedHeaders =
        process.env.NODE_ENV === "production"
            ? PRODUCTION_TRUSTED_IP_HEADERS
            : DEVELOPMENT_TRUSTED_IP_HEADERS;

    for (const headerName of trustedHeaders) {
        const ip = extractIpFromHeader(headerList.get(headerName));
        if (ip) return ip;
    }

    return null;
}

export function getClientIdentity(headerList: Headers): string {
    const ip = getClientIpFromHeaders(headerList);
    if (ip) {
        return `ip:${ip}`;
    }

    const userAgent = normalizeHeaderToken(headerList.get("user-agent"), 80);
    const acceptLanguage = normalizeHeaderToken(headerList.get("accept-language"), 32);
    return `fallback:${userAgent}|${acceptLanguage}`;
}
