"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import { Trash2, RefreshCw, RotateCcw, AlertTriangle, Clock, Package, FolderOpen, Wrench, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { BulkSelectionBar } from "@/components/admin/BulkSelectionBar";
import { safeJsonParse, transformImageLink } from "@/lib/utils";

interface TrashItem {
    id: string;
    name?: string;
    title?: string;
    type: 'product' | 'category' | 'service' | 'booking';
    deletedAt: string;
    remainingHours: number;
    images?: string;
    image?: string;
    category?: { name: string };
}

interface TrashItemFromAPI {
    id: string;
    name?: string;
    title?: string;
    deletedAt: string;
    remainingHours: number;
    images?: string;
    image?: string;
    category?: { name: string };
}

export default function TrashPage() {
    const t = useTranslations("adminTrash");
    const tBulk = useTranslations("adminBulk");
    const tAdmin = useTranslations("admin");
    const [items, setItems] = useState<TrashItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCleaning, setIsCleaning] = useState(false);
    const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    const fetchTrash = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/trash');
            if (!res.ok) throw new Error('Failed to fetch trash');
            const data = await res.json();
            
            // Combine all items into one list
            const allItems: TrashItem[] = [
                ...(Array.isArray(data.products) ? data.products : []).map((p: TrashItemFromAPI) => ({ ...p, type: 'product' as const })),
                ...(Array.isArray(data.categories) ? data.categories : []).map((c: TrashItemFromAPI) => ({ ...c, type: 'category' as const })),
                ...(Array.isArray(data.services) ? data.services : []).map((s: TrashItemFromAPI) => ({ ...s, type: 'service' as const })),
                ...(Array.isArray(data.bookings) ? data.bookings : []).map((b: TrashItemFromAPI) => ({ ...b, type: 'booking' as const }))
            ].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
            
            setItems(allItems);
        } catch (error) {
            console.error('Failed to fetch trash:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrash();
        // Refresh every minute to update countdown
        const interval = setInterval(fetchTrash, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setSelectedItemKeys((prev) =>
            prev.filter((key) => items.some((item) => `${item.type}:${item.id}` === key))
        );
    }, [items]);

    const getItemKey = (item: TrashItem) => `${item.type}:${item.id}`;

    const getEndpointByType = (item: TrashItem) =>
        item.type === "product"
            ? `/api/products/${item.id}`
            : item.type === "category"
                ? `/api/categories/${item.id}`
                : item.type === "service"
                    ? `/api/services/${item.id}`
                    : `/api/bookings/${item.id}`;

    const handleRestore = async (item: TrashItem) => {
        if (!confirm(`"${item.name || item.title}" ${tAdmin("restore")}?`)) return;

        try {
            const res = await fetch(getEndpointByType(item), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'restore' })
            });
            
            if (res.ok) {
                const itemKey = getItemKey(item);
                setItems((prev) => prev.filter((i) => getItemKey(i) !== itemKey));
                setSelectedItemKeys((prev) => prev.filter((selectedKey) => selectedKey !== itemKey));
            } else {
                alert(tBulk("failedActionForCount", { action: tBulk("restoreAction"), count: 1 }));
            }
        } catch (error) {
            console.error('Restore error:', error);
            alert(tBulk("failedActionForCount", { action: tBulk("restoreAction"), count: 1 }));
        }
    };

    const handlePermanentDelete = async (item: TrashItem) => {
        if (!confirm(`${t("deletePermanently")} "${item.name || item.title}"?`)) return;

        try {
            const res = await fetch(getEndpointByType(item), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'permanent-delete' })
            });
            
            if (res.ok) {
                const itemKey = getItemKey(item);
                setItems((prev) => prev.filter((i) => getItemKey(i) !== itemKey));
                setSelectedItemKeys((prev) => prev.filter((selectedKey) => selectedKey !== itemKey));
            } else {
                alert(tBulk("failedActionForCount", { action: tBulk("deleteActionLower"), count: 1 }));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert(tBulk("failedActionForCount", { action: tBulk("deleteActionLower"), count: 1 }));
        }
    };

    const handleCleanOld = async () => {
        if (!confirm(t("cleanOld") + '?')) return;
        
        setIsCleaning(true);
        try {
            const res = await fetch('/api/trash', { method: 'DELETE' });
            if (res.ok) {
                const data = await res.json();
                const deletedTotal =
                    data.deleted.products +
                    data.deleted.categories +
                    data.deleted.services +
                    (data.deleted.bookings ?? 0);
                alert(`Cleaned up ${deletedTotal} items`);
                fetchTrash();
            } else {
                alert('Failed to clean trash');
            }
        } catch (error) {
            console.error('Clean error:', error);
            alert('Failed to clean trash');
        } finally {
            setIsCleaning(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'product': return <Package size={20} className="text-blue-500" />;
            case 'category': return <FolderOpen size={20} className="text-green-500" />;
            case 'service': return <Wrench size={20} className="text-purple-500" />;
            case 'booking': return <ShoppingBag size={20} className="text-indigo-500" />;
            default: return <Trash2 size={20} />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'product': return tAdmin("products");
            case 'category': return tAdmin("categories");
            case 'service': return tAdmin("services");
            case 'booking': return tAdmin("bookings");
            default: return type;
        }
    };

    const PLACEHOLDER_IMAGE = '/placeholder.jpg';

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.currentTarget;
        target.onerror = null;
        target.src = PLACEHOLDER_IMAGE;
    };

    const getFirstImageFromJson = (imagesJson?: string) => {
        if (!imagesJson) return "";
        const parsed = safeJsonParse<unknown>(imagesJson, []);
        if (!Array.isArray(parsed)) return "";
        const firstImage = parsed[0];
        return typeof firstImage === "string" ? firstImage : "";
    };

    const normalizeImage = (url?: string) => {
        const transformed = transformImageLink(url ?? "");
        if (!transformed || transformed === "INVALID_FOLDER_LINK") {
            return PLACEHOLDER_IMAGE;
        }
        return transformed;
    };

    const getImage = (item: TrashItem) => {
        if (item.type === 'product') {
            return normalizeImage(getFirstImageFromJson(item.images));
        }
        if (item.type === 'category') {
            return normalizeImage(item.image);
        }
        if (item.type === 'service') {
            return normalizeImage(getFirstImageFromJson(item.images));
        }
        if (item.type === 'booking') {
            return PLACEHOLDER_IMAGE;
        }
        return PLACEHOLDER_IMAGE;
    };

    const isAllSelected = items.length > 0 && selectedItemKeys.length === items.length;

    const toggleSelect = (item: TrashItem) => {
        const itemKey = getItemKey(item);
        setSelectedItemKeys((prev) =>
            prev.includes(itemKey) ? prev.filter((key) => key !== itemKey) : [...prev, itemKey]
        );
    };

    const toggleSelectAll = () => {
        setSelectedItemKeys((prev) =>
            prev.length === items.length ? [] : items.map((item) => getItemKey(item))
        );
    };

    const bulkRestore = async () => {
        if (selectedItemKeys.length === 0) return;
        if (!confirm(tBulk("confirmActionForCount", { action: t("restore"), count: selectedItemKeys.length }))) return;

        setIsBulkProcessing(true);
        try {
            const selectedItems = items.filter((item) => selectedItemKeys.includes(getItemKey(item)));
            const results = await Promise.all(
                selectedItems.map(async (item) => {
                    const res = await fetch(getEndpointByType(item), {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "restore" })
                    });
                    return res.ok;
                })
            );

            const failedCount = results.filter((ok) => !ok).length;
            if (failedCount > 0) {
                alert(tBulk("failedActionForCount", { action: tBulk("restoreAction"), count: failedCount }));
            }

            setSelectedItemKeys([]);
            fetchTrash();
        } catch (error) {
            console.error("Bulk restore failed:", error);
            alert(tBulk("failedActionSelected", { action: tBulk("restoreAction") }));
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const bulkPermanentDelete = async () => {
        if (selectedItemKeys.length === 0) return;
        if (!confirm(tBulk("confirmActionForCount", { action: t("deletePermanently"), count: selectedItemKeys.length }))) return;

        setIsBulkProcessing(true);
        try {
            const selectedItems = items.filter((item) => selectedItemKeys.includes(getItemKey(item)));
            const results = await Promise.all(
                selectedItems.map(async (item) => {
                    const res = await fetch(getEndpointByType(item), {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "permanent-delete" })
                    });
                    return res.ok;
                })
            );

            const failedCount = results.filter((ok) => !ok).length;
            if (failedCount > 0) {
                alert(tBulk("failedActionForCount", { action: tBulk("deleteActionLower"), count: failedCount }));
            }

            setSelectedItemKeys([]);
            fetchTrash();
        } catch (error) {
            console.error("Bulk permanent delete failed:", error);
            alert(tBulk("failedActionSelected", { action: tBulk("deleteActionLower") }));
        } finally {
            setIsBulkProcessing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-3">
                        <Trash2 className="text-muted-foreground" />
                        {t("title")}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t("description")}
                    </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                    <button 
                        onClick={handleCleanOld}
                        disabled={isCleaning || items.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                    >
                        <AlertTriangle size={18} />
                        {isCleaning ? '...' : t("cleanOld")}
                    </button>
                    <button 
                        onClick={fetchTrash}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
                <Clock className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium">{t("warning")}</p>
                    <p className="mt-1">{t("warningDesc")}</p>
                </div>
            </div>

            <BulkSelectionBar
                totalCount={items.length}
                selectedCount={selectedItemKeys.length}
                allSelected={isAllSelected}
                onToggleSelectAll={toggleSelectAll}
                onClearSelection={() => setSelectedItemKeys([])}
                selectAllLabel={tBulk("selectAll")}
                selectedLabel={tBulk("selected")}
                clearLabel={tBulk("clear")}
                actions={
                    <>
                        <button
                            type="button"
                            onClick={bulkRestore}
                            disabled={selectedItemKeys.length === 0 || isBulkProcessing}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {t("restore")}
                        </button>
                        <button
                            type="button"
                            onClick={bulkPermanentDelete}
                            disabled={selectedItemKeys.length === 0 || isBulkProcessing}
                            className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                        >
                            {t("deletePermanently")}
                        </button>
                    </>
                }
            />

            {/* Trash Items List */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center">
                        <Trash2 size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">{t("empty")}</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                            {t("emptyDesc")}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 p-3 md:hidden">
                            {items.map((item) => {
                                const itemKey = getItemKey(item);
                                return (
                                <div key={itemKey} className="rounded-lg border border-border/80 bg-background/50 p-3">
                                    <div className="flex items-start gap-3">
                                        <label className="pt-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedItemKeys.includes(itemKey)}
                                                onChange={() => toggleSelect(item)}
                                                className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                                            />
                                        </label>
                                        {item.type !== 'booking' && (
                                            <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                                                <img
                                                    src={getImage(item)}
                                                    alt={item.name || item.title}
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                    onError={handleImageError}
                                                />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium leading-tight">{item.name || item.title}</p>
                                            {item.category && <p className="text-xs text-muted-foreground">{item.category.name}</p>}
                                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                {getIcon(item.type)}
                                                <span className="capitalize">{getTypeLabel(item.type)}</span>
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">{new Date(item.deletedAt).toLocaleString()}</p>
                                            <div className="mt-2">
                                                {item.remainingHours > 0 ? (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                                        item.remainingHours < 6
                                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                            : item.remainingHours < 24
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    }`}>
                                                        <Clock size={12} />
                                                        {item.remainingHours}{t("hoursLeft")}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                                        {t("expired")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleRestore(item)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                                            title={t("restore")}
                                        >
                                            <RotateCcw size={14} />
                                            {t("restore")}
                                        </button>
                                        <button
                                            onClick={() => handlePermanentDelete(item)}
                                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                            title={t("deletePermanently")}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>

                        <div className="hidden w-full overflow-x-auto md:block">
                            <table className="w-full min-w-[980px] text-left">
                                <thead className="bg-muted text-muted-foreground text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-4 font-bold whitespace-nowrap w-10">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={toggleSelectAll}
                                                className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                                            />
                                        </th>
                                        <th className="px-6 py-4 font-bold min-w-[280px]">{t("item")}</th>
                                        <th className="px-6 py-4 font-bold whitespace-nowrap min-w-[140px]">{t("type")}</th>
                                        <th className="px-6 py-4 font-bold whitespace-nowrap min-w-[180px]">{t("deleted")}</th>
                                        <th className="px-6 py-4 font-bold whitespace-nowrap min-w-[170px]">{t("timeRemaining")}</th>
                                        <th className="px-6 py-4 font-bold whitespace-nowrap text-right min-w-[170px]">{t("actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {items.map((item) => {
                                        const itemKey = getItemKey(item);
                                        return (
                                        <tr key={itemKey} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItemKeys.includes(itemKey)}
                                                    onChange={() => toggleSelect(item)}
                                                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {item.type !== 'booking' && (
                                                        <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                                                            <img
                                                                src={getImage(item)}
                                                                alt={item.name || item.title}
                                                                className="w-full h-full object-cover"
                                                                referrerPolicy="no-referrer"
                                                                onError={handleImageError}
                                                            />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{item.name || item.title}</p>
                                                        {item.category && (
                                                            <p className="text-xs text-muted-foreground">{item.category.name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {getIcon(item.type)}
                                                    <span className="capitalize">{getTypeLabel(item.type)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{new Date(item.deletedAt).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                {item.remainingHours > 0 ? (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                                                        item.remainingHours < 6
                                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                            : item.remainingHours < 24
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    }`}>
                                                        <Clock size={14} />
                                                        {item.remainingHours}{t("hoursLeft")}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium bg-red-100 text-red-700">
                                                        {t("expired")}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleRestore(item)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                                                        title={t("restore")}
                                                    >
                                                        <RotateCcw size={14} />
                                                        {t("restore")}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePermanentDelete(item)}
                                                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                        title={t("deletePermanently")}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
