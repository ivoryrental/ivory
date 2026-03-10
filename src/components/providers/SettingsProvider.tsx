"use client";

import { createContext, useContext, ReactNode } from "react";
import { DEFAULT_SETTINGS } from "@/lib/settings-shared";

const SettingsContext = createContext<typeof DEFAULT_SETTINGS>(DEFAULT_SETTINGS);

export function SettingsProvider({
    children,
    settings
}: {
    children: ReactNode,
    settings: typeof DEFAULT_SETTINGS
}) {
    return (
        <SettingsContext.Provider value={settings}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
