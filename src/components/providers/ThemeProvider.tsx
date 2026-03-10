"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface ValueObject {
    [themeName: string]: string;
}

type DataAttribute = `data-${string}`;
type Attribute = DataAttribute | "class";

interface ScriptProps extends React.ScriptHTMLAttributes<HTMLScriptElement> {
    [dataAttribute: DataAttribute]: unknown;
}

export interface ThemeProviderProps extends React.PropsWithChildren {
    themes?: string[];
    forcedTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    enableColorScheme?: boolean;
    storageKey?: string;
    defaultTheme?: string;
    attribute?: Attribute | Attribute[];
    value?: ValueObject;
    nonce?: string;
    scriptProps?: ScriptProps;
}

interface ThemeContextValue {
    themes: string[];
    forcedTheme?: string;
    setTheme: React.Dispatch<React.SetStateAction<string>>;
    theme?: string;
    resolvedTheme?: string;
    systemTheme?: "light" | "dark";
}

const MEDIA_QUERY = "(prefers-color-scheme: dark)";
const DEFAULT_THEMES = ["light", "dark"];
export const THEME_QUERY_PARAM = "__theme";

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

const defaultContext: ThemeContextValue = {
    setTheme: () => undefined,
    themes: [],
};

function getSystemTheme(mediaQueryList?: MediaQueryList | MediaQueryListEvent): "light" | "dark" {
    return (mediaQueryList ?? window.matchMedia(MEDIA_QUERY)).matches ? "dark" : "light";
}

function getStoredTheme(storageKey: string) {
    if (typeof window === "undefined") {
        return undefined;
    }

    try {
        return window.sessionStorage.getItem(storageKey) ?? undefined;
    } catch {
        return undefined;
    }
}

function getThemeFromUrl(allowedThemes: string[]) {
    if (typeof window === "undefined") {
        return undefined;
    }

    try {
        const theme = new URLSearchParams(window.location.search).get(THEME_QUERY_PARAM) ?? undefined;
        return theme && allowedThemes.includes(theme) ? theme : undefined;
    } catch {
        return undefined;
    }
}

function getThemeValues(themes: string[], value?: ValueObject) {
    return value ? themes.map((theme) => value[theme] ?? theme) : themes;
}

function disableTransitionsTemporarily(nonce?: string) {
    const style = document.createElement("style");

    if (nonce) {
        style.setAttribute("nonce", nonce);
    }

    style.appendChild(
        document.createTextNode(
            "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}"
        )
    );

    document.head.appendChild(style);

    return () => {
        window.getComputedStyle(document.body);
        window.setTimeout(() => {
            document.head.removeChild(style);
        }, 1);
    };
}

function applyThemeToDocument({
    theme,
    attribute,
    value,
    themes,
    enableSystem,
    enableColorScheme,
}: {
    theme?: string;
    attribute: Attribute | Attribute[];
    value?: ValueObject;
    themes: string[];
    enableSystem: boolean;
    enableColorScheme: boolean;
}) {
    if (typeof document === "undefined" || !theme) {
        return;
    }

    const root = document.documentElement;
    const resolvedTheme = theme === "system" && enableSystem ? getSystemTheme() : theme;
    const attributes = Array.isArray(attribute) ? attribute : [attribute];
    const themeValues = getThemeValues(themes, value);

    for (const currentAttribute of attributes) {
        if (currentAttribute === "class") {
            root.classList.remove(...themeValues);
            root.classList.add(value?.[resolvedTheme] ?? resolvedTheme);
            continue;
        }

        root.setAttribute(currentAttribute, value?.[resolvedTheme] ?? resolvedTheme);
    }

    if (enableColorScheme) {
        root.style.colorScheme = resolvedTheme === "light" || resolvedTheme === "dark" ? resolvedTheme : "";
    }
}

function themeScript({
    attribute,
    storageKey,
    defaultTheme,
    forcedTheme,
    themes,
    value,
    enableSystem,
    enableColorScheme,
}: {
    attribute: Attribute | Attribute[];
    storageKey: string;
    defaultTheme: string;
    forcedTheme?: string;
    themes: string[];
    value?: ValueObject;
    enableSystem: boolean;
    enableColorScheme: boolean;
}) {
    const root = document.documentElement;
    const attributes = Array.isArray(attribute) ? attribute : [attribute];
    const themeValues = value ? themes.map((theme) => value[theme] || theme) : themes;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

    function applyTheme(theme?: string) {
        if (!theme) {
            return;
        }

        const resolvedTheme = theme === "system" && enableSystem ? systemTheme : theme;

        for (const currentAttribute of attributes) {
            if (currentAttribute === "class") {
                root.classList.remove(...themeValues);
                root.classList.add((value && value[resolvedTheme]) || resolvedTheme);
                continue;
            }

            root.setAttribute(currentAttribute, (value && value[resolvedTheme]) || resolvedTheme);
        }

        if (enableColorScheme) {
            root.style.colorScheme = resolvedTheme === "light" || resolvedTheme === "dark" ? resolvedTheme : "";
        }
    }

    let theme = forcedTheme;

    if (!theme) {
        try {
            const storedTheme = window.sessionStorage.getItem(storageKey);
            const urlTheme = new URLSearchParams(window.location.search).get("__theme");
            theme = storedTheme || (urlTheme && themes.includes(urlTheme) ? urlTheme : null) || defaultTheme;
        } catch {
            theme = defaultTheme;
        }
    }

    applyTheme(theme);
}

export function ThemeProvider({
    children,
    forcedTheme,
    disableTransitionOnChange = true,
    enableSystem = true,
    enableColorScheme = true,
    storageKey = "theme",
    themes = DEFAULT_THEMES,
    defaultTheme = enableSystem ? "system" : "light",
    attribute = "class",
    value,
    nonce,
    scriptProps,
}: ThemeProviderProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const allowedThemes = React.useMemo(
        () => (enableSystem ? [...themes, "system"] : themes),
        [enableSystem, themes]
    );
    const [theme, setThemeState] = React.useState<string>(() => {
        if (typeof window === "undefined") {
            return defaultTheme;
        }

        return getStoredTheme(storageKey) ?? getThemeFromUrl(allowedThemes) ?? defaultTheme;
    });
    const [systemTheme, setSystemTheme] = React.useState<"light" | "dark" | undefined>(() => {
        if (typeof window === "undefined") {
            return undefined;
        }

        return getSystemTheme();
    });

    const setTheme = React.useCallback<React.Dispatch<React.SetStateAction<string>>>(
        (valueOrUpdater) => {
            setThemeState((currentTheme) => {
                const nextTheme =
                    typeof valueOrUpdater === "function" ? valueOrUpdater(currentTheme) : valueOrUpdater;

                try {
                    window.sessionStorage.setItem(storageKey, nextTheme);
                } catch {
                    // Ignore storage failures and keep the in-memory state.
                }

                return nextTheme;
            });
        },
        [storageKey]
    );

    React.useEffect(() => {
        setThemeState(getStoredTheme(storageKey) ?? getThemeFromUrl(allowedThemes) ?? defaultTheme);
    }, [allowedThemes, defaultTheme, storageKey]);

    React.useEffect(() => {
        if (!pathname || !searchParams.has(THEME_QUERY_PARAM)) {
            return;
        }

        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete(THEME_QUERY_PARAM);

        const nextSearch = nextParams.toString();
        const nextUrl = `${pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
        window.history.replaceState(window.history.state, "", nextUrl);
    }, [pathname, searchParams]);

    React.useEffect(() => {
        if (!enableSystem) {
            return undefined;
        }

        const mediaQueryList = window.matchMedia(MEDIA_QUERY);
        const handleChange = (event: MediaQueryListEvent) => {
            setSystemTheme(getSystemTheme(event));
        };

        setSystemTheme(getSystemTheme(mediaQueryList));

        if (typeof mediaQueryList.addEventListener === "function") {
            mediaQueryList.addEventListener("change", handleChange);

            return () => {
                mediaQueryList.removeEventListener("change", handleChange);
            };
        }

        mediaQueryList.addListener(handleChange);

        return () => {
            mediaQueryList.removeListener(handleChange);
        };
    }, [enableSystem]);

    React.useEffect(() => {
        const cleanup = disableTransitionOnChange ? disableTransitionsTemporarily(nonce) : undefined;

        applyThemeToDocument({
            theme: forcedTheme ?? theme,
            attribute,
            value,
            themes,
            enableSystem,
            enableColorScheme,
        });

        cleanup?.();
    }, [
        attribute,
        disableTransitionOnChange,
        enableColorScheme,
        enableSystem,
        forcedTheme,
        nonce,
        systemTheme,
        theme,
        themes,
        value,
    ]);

    const contextValue = React.useMemo<ThemeContextValue>(
        () => ({
            theme,
            setTheme,
            forcedTheme,
            resolvedTheme: (forcedTheme ?? theme) === "system" ? systemTheme : forcedTheme ?? theme,
            themes: allowedThemes,
            systemTheme,
        }),
        [allowedThemes, forcedTheme, setTheme, systemTheme, theme]
    );

    return (
        <ThemeContext.Provider value={contextValue}>
            <script
                {...scriptProps}
                suppressHydrationWarning
                nonce={typeof window === "undefined" ? nonce : ""}
                dangerouslySetInnerHTML={{
                    __html: `(${themeScript.toString()})(${JSON.stringify({
                        attribute,
                        storageKey,
                        defaultTheme,
                        forcedTheme,
                        themes,
                        value,
                        enableSystem,
                        enableColorScheme,
                    })})`,
                }}
            />
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return React.useContext(ThemeContext) ?? defaultContext;
}
