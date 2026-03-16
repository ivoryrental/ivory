import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['en', 'ka', 'ru'],

    // Used when no locale matches
    defaultLocale: 'ka',

    // Always fall back to Georgian for unprefixed entries like `/`
    localeDetection: false
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, usePathname, useRouter } =
    createNavigation(routing);
