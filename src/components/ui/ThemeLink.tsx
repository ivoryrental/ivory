"use client";

import * as React from "react";
import { Link as I18nLink } from "@/i18n/routing";
import { THEME_QUERY_PARAM, useTheme } from "@/components/providers/ThemeProvider";

type ThemeLinkProps = React.ComponentProps<typeof I18nLink>;

function isDecoratedHref(href: string) {
    return (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("//") ||
        /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href)
    );
}

function withThemeParam(href: string, theme?: string) {
    if (!theme || isDecoratedHref(href)) {
        return href;
    }

    const url = new URL(href, "http://ivory.local");
    url.searchParams.set(THEME_QUERY_PARAM, theme);

    return `${url.pathname}${url.search}${url.hash}`;
}

export const ThemeLink = React.forwardRef<HTMLAnchorElement, ThemeLinkProps>(
    function ThemeLink({ href, ...props }, ref) {
        const { theme, resolvedTheme } = useTheme();
        const inheritedTheme = theme === "system" ? resolvedTheme : theme ?? resolvedTheme;

        const themedHref = React.useMemo(() => {
            if (typeof href !== "string") {
                return href;
            }

            return withThemeParam(href, inheritedTheme);
        }, [href, inheritedTheme]);

        return <I18nLink ref={ref} href={themedHref} {...props} />;
    }
);

ThemeLink.displayName = "ThemeLink";
