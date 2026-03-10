"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BulkSelectionBarProps {
    totalCount: number;
    selectedCount: number;
    allSelected: boolean;
    onToggleSelectAll: () => void;
    onClearSelection: () => void;
    actions?: ReactNode;
    selectAllLabel: string;
    selectedLabel: string;
    clearLabel: string;
    className?: string;
}

export function BulkSelectionBar({
    totalCount,
    selectedCount,
    allSelected,
    onToggleSelectAll,
    onClearSelection,
    actions,
    selectAllLabel,
    selectedLabel,
    clearLabel,
    className
}: BulkSelectionBarProps) {
    if (totalCount === 0) {
        return null;
    }

    return (
        <div className={cn("rounded-lg border border-border bg-card/70 p-3", className)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={onToggleSelectAll}
                        className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                    />
                    <span>{selectAllLabel}</span>
                </label>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {selectedCount} {selectedLabel}
                    </span>
                    {selectedCount > 0 && (
                        <button
                            type="button"
                            onClick={onClearSelection}
                            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                            {clearLabel}
                        </button>
                    )}
                    {actions}
                </div>
            </div>
        </div>
    );
}
