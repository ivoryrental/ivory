import { NextRequest, NextResponse } from "next/server";
import { normalizeImageLink } from "@/lib/utils";

const ALLOWED_IMAGE_HOSTS = new Set([
    "drive.google.com",
    "drive.usercontent.google.com",
    "lh3.googleusercontent.com",
]);
const FETCH_TIMEOUT_MS = 10_000;

function isAllowedRemote(url: URL): boolean {
    const hostname = url.hostname.toLowerCase();
    return ALLOWED_IMAGE_HOSTS.has(hostname) || hostname.endsWith(".googleusercontent.com");
}

export async function GET(request: NextRequest) {
    const source = request.nextUrl.searchParams.get("url");
    if (!source) {
        return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const normalized = normalizeImageLink(source);
    if (!normalized || normalized === "INVALID_FOLDER_LINK") {
        return NextResponse.json({ error: "Invalid image url" }, { status: 400 });
    }

    let target: URL;
    try {
        target = new URL(normalized);
    } catch {
        return NextResponse.json({ error: "Invalid image url" }, { status: 400 });
    }

    if (target.protocol !== "https:") {
        return NextResponse.json({ error: "Only HTTPS image URLs are allowed" }, { status: 400 });
    }

    if (!isAllowedRemote(target)) {
        return NextResponse.json({ error: "Host not allowed" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let upstream: Response;
    try {
        upstream = await fetch(target.toString(), {
            headers: {
                Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                "User-Agent": "Mozilla/5.0 (compatible; IvoryImageProxy/1.0)",
            },
            cache: "force-cache",
            signal: controller.signal,
        });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return NextResponse.json({ error: "Image fetch timeout" }, { status: 504 });
        }
        return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    } finally {
        clearTimeout(timeout);
    }

    if (!upstream.ok) {
        return NextResponse.json({ error: "Failed to fetch image" }, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    if (!contentType.startsWith("image/")) {
        return NextResponse.json({ error: "Upstream did not return an image" }, { status: 415 });
    }

    return new NextResponse(upstream.body, {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        },
    });
}
