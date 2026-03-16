"use client";

export const META_PIXEL_ID = "2449675508796473";

const MAX_TRACK_RETRIES = 20;
const TRACK_RETRY_DELAY_MS = 300;

type MetaPixelFunction = {
    (...args: unknown[]): void;
    callMethod?: (...args: unknown[]) => void;
    queue?: unknown[][];
    push?: (...args: unknown[]) => void;
    loaded?: boolean;
    version?: string;
};

declare global {
    interface Window {
        fbq?: MetaPixelFunction;
        _fbq?: MetaPixelFunction;
    }
}

export type MetaPixelEventParams = Record<string, unknown>;

export function trackMetaEvent(
    eventName: string,
    parameters?: MetaPixelEventParams,
    retries = MAX_TRACK_RETRIES
) {
    if (typeof window === "undefined") {
        return;
    }

    if (typeof window.fbq === "function") {
        if (parameters && Object.keys(parameters).length > 0) {
            window.fbq("track", eventName, parameters);
        } else {
            window.fbq("track", eventName);
        }
        return;
    }

    if (retries <= 0) {
        return;
    }

    window.setTimeout(() => {
        trackMetaEvent(eventName, parameters, retries - 1);
    }, TRACK_RETRY_DELAY_MS);
}
