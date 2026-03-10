"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// THE CUSTOM LOGO
const SVG_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(`<?xml version="1.0" encoding="UTF-8"?><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150"><defs><style>.cls-1{fill:#fdfaf5;}.cls-2{fill:#c36196;}</style></defs><rect class="cls-1" x="5.03" y="5.03" width="139.95" height="139.95" rx="49.32" ry="49.32"/><g><rect class="cls-2" x="-3.15" y="67.69" width="120.56" height="14.63" rx="7.31" ry="7.31" transform="translate(-32.47 104.35) rotate(-70.84)"/><rect class="cls-2" x="34.81" y="67.69" width="120.56" height="14.63" rx="7.31" ry="7.31" transform="translate(-6.97 140.2) rotate(-70.84)"/><rect class="cls-2" x="16.29" y="86.86" width="117.42" height="14.63" rx="7.31" ry="7.31"/><rect class="cls-2" x="16.29" y="50.89" width="117.42" height="14.63" rx="7.31" ry="7.31"/></g></svg>`)}`;

const FaviconAnimatorLoop = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const faviconLinkRef = useRef<HTMLLinkElement | null>(null);
    const timeoutRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const SPIN_DURATION = 1000;
        const IDLE_DURATION = 5000;
        let handleVisibility: (() => void) | null = null;

        const clearTimers = () => {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };

        const draw = (image: HTMLImageElement, degrees: number) => {
            if (!canvasRef.current || !faviconLinkRef.current) return;
            const ctx = canvasRef.current.getContext("2d");
            if (!ctx) return;

            const size = 64;
            const center = size / 2;

            ctx.clearRect(0, 0, size, size);
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate((degrees * Math.PI) / 180);
            ctx.drawImage(image, -center, -center, size, size);
            ctx.restore();

            faviconLinkRef.current.href = ctx.canvas.toDataURL("image/png");
        };

        // Setup Canvas
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        canvasRef.current = canvas;

        const img = new Image();
        img.src = SVG_DATA_URI;

        img.onload = () => {
            // STRATEGY CHANGE: Hijack the existing link instead of replacing it.
            // This plays nicer with Next.js metadata and prevents conflicts.

            // 1. Find the primary icon link (ignore apple-touch-icon)
            let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;

            // 2. If not found (unlikely), create it
            if (!link) {
                link = document.createElement("link");
                link.rel = "icon";
                document.head.appendChild(link);
            }

            // 3. Prepare it for dynamic updates
            // We just update the reference, we don't remove it from DOM.
            faviconLinkRef.current = link;

            // Optional: force type update
            link.type = "image/png";

            const runCycle = () => {
                clearTimers();

                if (document.hidden) {
                    timeoutRef.current = window.setTimeout(runCycle, 1000);
                    return;
                }

                const startTime = performance.now();
                const step = (now: number) => {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / SPIN_DURATION, 1);
                    draw(img, progress * 360);

                    if (progress < 1) {
                        rafRef.current = window.requestAnimationFrame(step);
                        return;
                    }

                    // Reset to zero rotation, then idle.
                    draw(img, 0);
                    timeoutRef.current = window.setTimeout(runCycle, IDLE_DURATION);
                };

                rafRef.current = window.requestAnimationFrame(step);
            };

            handleVisibility = () => {
                runCycle();
            };

            document.addEventListener("visibilitychange", handleVisibility);
            runCycle();
        };

        return () => {
            if (handleVisibility) {
                document.removeEventListener("visibilitychange", handleVisibility);
            }
            img.onload = null;
            clearTimers();
        };
    }, []);

    return null;
};

export const FaviconAnimator = () => {
    const pathname = usePathname();

    if (pathname?.includes("/admin")) {
        return null;
    }

    return <FaviconAnimatorLoop />;
};
