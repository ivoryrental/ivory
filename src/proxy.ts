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

    const scriptDirectives = [`'self'`, `'nonce-${nonce}'`];
    if (!isProduction) {
        scriptDirectives.push(`'unsafe-eval'`);
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
        "img-src 'self' data: blob: https://drive.google.com https://drive.usercontent.google.com https://lh3.googleusercontent.com https://*.googleusercontent.com",
        "font-src 'self' data:",
        isProduction
            ? "connect-src 'self'"
            : "connect-src 'self' ws: wss: http://localhost:* http://127.0.0.1:*",
        "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com",
        ...(isProduction ? ["upgrade-insecure-requests"] : []),
    ].join('; ');
}

function applySecurityHeaders(response: NextResponse, csp: string, nonce: string): NextResponse {
    response.headers.set('Content-Security-Policy', csp);
    response.headers.set('x-nonce', nonce);
    return response;
}

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const clientIdentity = getClientIdentity(request.headers);
    const nonce = generateNonce();
    const csp = buildCsp(nonce);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);

    // 0. Rate Limiting (Public POST APIs)
    if (pathname === '/api/contact' && request.method === 'POST') {
        const rateLimit = await limitContactRequests(clientIdentity);
        if (!rateLimit.success) {
            const response = NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': retryAfterSeconds(rateLimit) } }
            );
            return applySecurityHeaders(response, csp, nonce);
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
            return applySecurityHeaders(response, csp, nonce);
        }
    }

    // 2. Continue request
    if (isApiRoute || (request.method !== 'GET' && request.method !== 'HEAD')) {
        const response = NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
        return applySecurityHeaders(response, csp, nonce);
    }

    const handleI18n = createMiddleware(routing);
    const requestWithNonce = new NextRequest(request.url, {
        method: request.method,
        headers: requestHeaders,
    });
    const response = handleI18n(requestWithNonce);
    return applySecurityHeaders(response, csp, nonce);
}

export const config = {
    matcher: ['/', '/(ka|en|ru)/:path*', '/admin/:path*', '/api/:path*']
};
