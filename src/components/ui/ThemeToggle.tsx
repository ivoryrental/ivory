"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={cn("w-9 h-9", className)} />;
    }

    const isDark = resolvedTheme === "dark";

    return (
        <button
            onClick={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
            }}
            className={cn(
                "rounded-full p-2 hover:bg-muted transition-colors",
                className
            )}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {isDark ? (
                // Dark Mode: Show Sun (to switch to Light)
                <Sun className="h-[1.2rem] w-[1.2rem] text-foreground" />
            ) : (
                // Light Mode: Show Moon (to switch to Dark)
                <Moon className="h-[1.2rem] w-[1.2rem] text-foreground" />
            )}
        </button>
    );
}
