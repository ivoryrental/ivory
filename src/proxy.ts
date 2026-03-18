import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/auth';
import { limitContactRequests, retryAfterSeconds } from './lib/rate-limit';
import { getClientIdentity } from './lib/client-identity';

const LOCALIZED_ADMIN_ROUTE_PATTERN = /^\/(en|ka|ru)\/admin(?:\/|$)/;
const ROOT_ADMIN_ROUTE_PATTERN = /^\/admin(?:\/|$)/;
const LOCALIZED_ADMIN_LOGIN_PATTERN = /^\/(en|ka|ru)\/admin\/login(?:\/|$)/;
const ROOT_ADMIN_LOGIN_PATTERN = /^\/admin\/login(?:\/|$)/;
const SOCIAL_CRAWLER_UA_PATTERN =
    /(facebookexternalhit|facebot|meta-externalagent|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegrambot|skypeuripreview|googlebot|bingbot|viber|line|kakaotalk|pinterest|vkshare|snapchat|teamsbot|applebot|flipboardproxy|threadsbot)/i;

function generateNonce(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    let binary = '';
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

function buildCsp(nonce: string): string {
    const isProduction = process.env.NODE_ENV === 'production';

    const scriptDirectives = [`'self'`, `'nonce-${nonce}'`, 'https://connect.facebook.net'];
    const imageDirectives = [
        "'self'",
        'data:',
        'blob:',
        'https://drive.google.com',
        'https://drive.usercontent.google.com',
        'https://lh3.googleusercontent.com',
        'https://*.googleusercontent.com',
        'https://www.facebook.com',
    ];
    const connectDirectives = [
        "'self'",
        'https://connect.facebook.net',
        'https://www.facebook.com',
    ];
    if (!isProduction) {
        scriptDirectives.push(`'unsafe-eval'`);
        connectDirectives.push('ws:', 'wss:', 'http://localhost:*', 'http://127.0.0.1:*');
    }

    return [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        `script-src ${scriptDirectives.join(' ')}`,
        "script-src-attr 'none'",
        "style-src 'self' 'unsafe-inline'",
        `img-src ${imageDirectives.join(' ')}`,
        "font-src 'self' data:",
        `connect-src ${connectDirectives.join(' ')}`,
        "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com",
        ...(isProduction ? ["upgrade-insecure-requests"] : []),
    ].join('; ');
}

function isCrossOriginPreviewAsset(pathname: string): boolean {
    return (
        pathname.startsWith('/api/og-image/') ||
        pathname === '/api/og-image' ||
        pathname.startsWith('/og-image-')
    );
}

function applySecurityHeaders(response: NextResponse, csp: string, nonce: string, pathname: string): NextResponse {
    response.headers.set('Content-Security-Policy', csp);
    response.headers.set('x-nonce', nonce);
    response.headers.set(
        'Cross-Origin-Resource-Policy',
        isCrossOriginPreviewAsset(pathname) ? 'cross-origin' : 'same-origin'
    );

    if (isCrossOriginPreviewAsset(pathname)) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Content-Disposition', 'inline');
    }

    return response;
}

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const clientIdentity = getClientIdentity(request.headers);
    const nonce = generateNonce();
    const csp = buildCsp(nonce);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    const userAgent = request.headers.get('user-agent') ?? '';
    const isSocialCrawler = SOCIAL_CRAWLER_UA_PATTERN.test(userAgent);

    // 0. Rate Limiting (Public POST APIs)
    if (pathname === '/api/contact' && request.method === 'POST') {
        const rateLimit = await limitContactRequests(clientIdentity);
        if (!rateLimit.success) {
            const response = NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': retryAfterSeconds(rateLimit) } }
            );
            return applySecurityHeaders(response, csp, nonce, pathname);
        }
    }

    // 1. Check for Admin Routes
    const isAdminRoute = LOCALIZED_ADMIN_ROUTE_PATTERN.test(pathname) || ROOT_ADMIN_ROUTE_PATTERN.test(pathname);
    const isLoginPage =
        LOCALIZED_ADMIN_LOGIN_PATTERN.test(pathname) || ROOT_ADMIN_LOGIN_PATTERN.test(pathname);
    const isApiRoute = pathname.startsWith('/api');

    if (isAdminRoute && !isLoginPage) {
        const session = request.cookies.get('session')?.value;
        const payload = session ? await decrypt(session) : null;

        if (!payload) {
            // Redirect to login, preserving locale if possible or defaulting
            const locale = pathname.match(/^\/(en|ka|ru)/)?.[1] || 'ka';
            const response = NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
            return applySecurityHeaders(response, csp, nonce, pathname);
        }
    }

    // 2. Continue request
    if (isApiRoute || (request.method !== 'GET' && request.method !== 'HEAD')) {
        const response = NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
        return applySecurityHeaders(response, csp, nonce, pathname);
    }

    if (isSocialCrawler && !isAdminRoute) {
        const rewriteUrl = new URL('/api/share-preview/resolve', request.url);
        rewriteUrl.searchParams.set('previewPath', pathname);
        request.nextUrl.searchParams.forEach((value, key) => {
            rewriteUrl.searchParams.append(key, value);
        });
        const response = NextResponse.rewrite(rewriteUrl, {
            request: {
                headers: requestHeaders,
            },
        });
        return applySecurityHeaders(response, csp, nonce, pathname);
    }

    const handleI18n = createMiddleware(routing);
    const requestWithNonce = new NextRequest(request.url, {
        method: request.method,
        headers: requestHeaders,
    });
    const response = handleI18n(requestWithNonce);
    return applySecurityHeaders(response, csp, nonce, pathname);
}

export const config = {
    matcher: ['/', '/(ka|en|ru)/:path*', '/admin/:path*', '/api/:path*']
};
