"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { Booking } from "@/lib/types";
import { CheckSquare, Eye, X, Phone, Mail, ShoppingBag, ArrowLeft, Trash2, Calendar, RotateCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils";
import { BulkSelectionBar } from "@/components/admin/BulkSelectionBar";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeLink as Link } from "@/components/ui/ThemeLink";

interface BookingItem {
    name: string;
    price: number;
    quantity: number;
}

export default function BookingsHistoryPage() {
    const t = useTranslations("adminBookings");
    const tBulk = useTranslations("adminBulk");
    const tCommon = useTranslations("common");
    const tCatalog = useTranslations("catalogPage");
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isPending, startTransition] = useTransition();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    // Fetch bookings on mount - using useTransition to avoid synchronous setState warnings
    useEffect(() => {
        startTransition(() => {
            setIsLoading(true);
            fetch('/api/bookings?status=completed')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setBookings(data);
                    } else {
                        setBookings([]);
                    }
                })
                .catch(() => setBookings([]))
                .finally(() => setIsLoading(false));
        });
    }, []);

    useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => bookings.some((booking) => booking.id === id)));
    }, [bookings]);

    const refreshBookings = () => {
        startTransition(() => {
            setIsLoading(true);
            fetch('/api/bookings?status=completed')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setBookings(data);
                    } else {
                        setBookings([]);
                    }
                })
                .catch(() => setBookings([]))
                .finally(() => setIsLoading(false));
        });
    };

    const deleteBooking = async (id: string) => {
        if (!confirm(t('deleteFromHistory') + '?')) return;

        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                refreshBookings();
                setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
                if (selectedBooking?.id === id) {
                    setSelectedBooking(null);
                }
            }
        } catch (error) {
            console.error('Failed to delete booking:', error);
        }
    };

    const restoreBooking = async (id: string) => {
        if (!confirm(t('restoreToBookings') + '?')) return;

        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'confirmed' })
            });
            if (res.ok) {
                refreshBookings();
                setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
                if (selectedBooking?.id === id) {
                    setSelectedBooking(null);
                }
            }
        } catch (error) {
            console.error('Failed to restore booking:', error);
        }
    };

    const filteredBookings = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return bookings;

        const compactQuery = query.replace(/\s+/g, '');
        return bookings.filter((booking) => {
            const shortId = booking.id.slice(-8);
            const fields = [
                booking.id,
                shortId,
                `#${shortId}`,
                booking.customerName,
                booking.email,
                booking.date,
                booking.dateISO ?? '',
                booking.completedDate ?? '',
                booking.completedDateISO ?? '',
                booking.totalAmount.toString(),
                booking.totalAmount.toFixed(2),
                formatPrice(booking.totalAmount)
            ];

            return fields.some((value) => {
                const normalizedValue = value.toLowerCase();
                return normalizedValue.includes(query) || normalizedValue.replace(/\s+/g, '').includes(compactQuery);
            });
        });
    }, [bookings, searchTerm]);

    const isAllVisibleSelected = filteredBookings.length > 0 && filteredBookings.every((booking) => selectedIds.includes(booking.id));

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
        );
    };

    const toggleSelectAllVisible = () => {
        const visibleIds = filteredBookings.map((booking) => booking.id);
        const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
        if (allVisibleSelected) {
            setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
        }
    };

    const bulkRestoreBookings = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(tBulk("confirmActionForCount", { action: t('restoreToBookings'), count: selectedIds.length }))) return;

        setIsBulkProcessing(true);
        try {
            const results = await Promise.all(
                selectedIds.map(async (id) => {
                    const res = await fetch(`/api/bookings/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "confirmed" })
                    });
                    return res.ok;
                })
            );

            const failedCount = results.filter((ok) => !ok).length;
            if (failedCount > 0) {
                alert(tBulk("failedActionForCount", { action: tBulk("restoreAction"), count: failedCount }));
            }

            if (selectedBooking && selectedIds.includes(selectedBooking.id)) {
                setSelectedBooking(null);
            }

            setSelectedIds([]);
            refreshBookings();
        } catch (error) {
            console.error("Bulk restore failed:", error);
            alert(tBulk("failedActionSelected", { action: tBulk("restoreAction") }));
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const bulkDeleteBookings = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(tBulk("confirmActionForCount", { action: t('deleteFromHistory'), count: selectedIds.length }))) return;

        setIsBulkProcessing(true);
        try {
            const results = await Promise.all(
                selectedIds.map(async (id) => {
                    const res = await fetch(`/api/bookings/${id}`, {
                        method: "DELETE"
                    });
                    return res.ok;
                })
            );

            const failedCount = results.filter((ok) => !ok).length;
            if (failedCount > 0) {
                alert(tBulk("failedActionForCount", { action: tBulk("deleteActionLower"), count: failedCount }));
            }

            if (selectedBooking && selectedIds.includes(selectedBooking.id)) {
                setSelectedBooking(null);
            }

            setSelectedIds([]);
            refreshBookings();
        } catch (error) {
            console.error("Bulk history delete failed:", error);
            alert(tBulk("failedActionSelected", { action: tBulk("deleteActionLower") }));
        } finally {
            setIsBulkProcessing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 relative">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/bookings"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                    <ArrowLeft size={18} />
                    {t('backToBookings')}
                </Link>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold font-serif text-foreground">{t('history')}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={18} />
                    <span>{t('completedOrders')}</span>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-4">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={tCatalog('search')}
                        className="w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                    {t('table.id')} • {t('table.customer')} • {tCommon('email')} • {t('table.date')} • {t('completedDate')} • {t('table.total')}
                </p>
            </div>

            <BulkSelectionBar
                totalCount={filteredBookings.length}
                selectedCount={selectedIds.length}
                allSelected={isAllVisibleSelected}
                onToggleSelectAll={toggleSelectAllVisible}
                onClearSelection={() => setSelectedIds([])}
                selectAllLabel={tBulk("selectAll")}
                selectedLabel={tBulk("selected")}
                clearLabel={tBulk("clear")}
                actions={
                    <>
                        <button
                            type="button"
                            onClick={bulkRestoreBookings}
                            disabled={selectedIds.length === 0 || isBulkProcessing}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {t('restoreToBookings')}
                        </button>
                        <button
                            type="button"
                            onClick={bulkDeleteBookings}
                            disabled={selectedIds.length === 0 || isBulkProcessing}
                            className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                        >
                            {t('deleteFromHistory')}
                        </button>
                    </>
                }
            />

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="space-y-3 p-3 md:hidden">
                    {filteredBookings.map((booking) => (
                        <div key={booking.id} className="rounded-lg border border-border/80 bg-background/50 p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <label className="mb-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(booking.id)}
                                            onChange={() => toggleSelect(booking.id)}
                                            className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                                        />
                                        {tBulk("select")}
                                    </label>
                                    <p className="font-mono text-xs text-muted-foreground">#{booking.id.slice(-8)}</p>
                                    <p className="mt-1 font-semibold leading-tight">{booking.customerName}</p>
                                    <p className="text-xs text-muted-foreground break-all">{booking.email}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{t('table.date')}: {booking.date}</p>
                                    <p className="text-xs text-muted-foreground">{t('completedDate')}: {booking.completedDate ?? "-"}</p>
                                </div>
                                <p className="text-sm font-bold text-primary">{formatPrice(booking.totalAmount)}</p>
                            </div>
                            <div className="mt-3 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setSelectedBooking(booking)}
                                    className="p-2 hover:bg-muted rounded-full transition-colors text-primary"
                                    title={t('viewDetails')}
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => restoreBooking(booking.id)}
                                    className="p-2 hover:bg-green-500/10 rounded-full transition-colors text-green-500"
                                    title={t('restoreToBookings')}
                                >
                                    <RotateCcw size={18} />
                                </button>
                                <button
                                    onClick={() => deleteBooking(booking.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-red-500"
                                    title={t('deleteFromHistory')}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hidden w-full overflow-x-auto md:block">
                    <table className="w-full min-w-[1080px] text-left">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase">
                            <tr>
                                <th className="px-4 py-4 font-bold whitespace-nowrap w-10">
                                    <input
                                        type="checkbox"
                                        checked={isAllVisibleSelected}
                                        onChange={toggleSelectAllVisible}
                                        className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                                    />
                                </th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap min-w-[140px]">{t('table.id')}</th>
                                <th className="px-6 py-4 font-bold min-w-[280px]">{t('table.customer')}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap min-w-[150px]">{t('table.date')}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap min-w-[170px]">{t('completedDate')}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap text-right min-w-[130px]">{t('table.total')}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap text-center min-w-[150px]">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(booking.id)}
                                            onChange={() => toggleSelect(booking.id)}
                                            className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">#{booking.id.slice(-8)}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-sm">{booking.customerName}</div>
                                        <div className="text-xs text-muted-foreground">{booking.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{booking.date}</td>
                                    <td className="px-6 py-4 text-sm">{booking.completedDate ?? "-"}</td>
                                    <td className="px-6 py-4 font-bold text-right text-primary">{formatPrice(booking.totalAmount)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setSelectedBooking(booking)}
                                                className="p-2 hover:bg-muted rounded-full transition-colors text-primary"
                                                title={t('viewDetails')}
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => restoreBooking(booking.id)}
                                                className="p-2 hover:bg-green-500/10 rounded-full transition-colors text-green-500"
                                                title={t('restoreToBookings')}
                                            >
                                                <RotateCcw size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteBooking(booking.id)}
                                                className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-red-500"
                                                title={t('deleteFromHistory')}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredBookings.length === 0 && !isLoading && !isPending && (
                    <div className="p-12 text-center text-muted-foreground space-y-2">
                        <ShoppingBag size={48} className="mx-auto opacity-10" />
                        <p>{bookings.length === 0 ? t('noCompletedBookings') : t('noBookings')}</p>
                        <p className="text-sm">
                            {bookings.length === 0
                                ? t('completedBookingsAppearHere')
                                : `${t('table.id')} • ${t('table.customer')} • ${tCommon('email')}`}
                        </p>
                    </div>
                )}
            </div>

            {/* Booking Details Drawer */}
            <AnimatePresence>
                {selectedBooking && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBooking(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-lg bg-background shadow-2xl z-[101] flex flex-col border-l border-border"
                        >
                            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                                <div>
                                    <h2 className="text-xl font-serif font-bold text-primary">{t('bookingDetails')}</h2>
                                    <p className="text-xs text-muted-foreground font-mono">#{selectedBooking.id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="p-2 hover:bg-muted rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Status Banner */}
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-center gap-3">
                                    <CheckSquare size={24} className="text-blue-500" />
                                    <div>
                                        <p className="font-bold text-blue-700">{t('completed')}</p>
                                        <p className="text-sm text-blue-600">{t('completedDesc')}</p>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <section className="space-y-4">
                                    <h3 className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('customer')}</h3>
                                    <div className="bg-muted/30 p-4 rounded-xl space-y-3 border border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Eye size={16} />
                                            </div>
                                            <span className="font-bold">{selectedBooking.customerName}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <Mail size={16} />
                                            <span>{selectedBooking.email}</span>
                                        </div>
                                        {selectedBooking.phone && (
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <Phone size={16} />
                                                <span>{selectedBooking.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Items */}
                                <section className="space-y-4">
                                    <h3 className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('items')}</h3>
                                    <div className="space-y-3">
                                        {selectedBooking.items.map((item: BookingItem, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-[10px] font-bold">ITEM</div>
                                                    <div>
                                                        <p className="text-sm font-bold">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">₾{item.price} x {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-sm">₾{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                        <div className="pt-4 flex justify-between items-center border-t border-border">
                                            <span className="font-bold">{t('totalAmount')}</span>
                                            <span className="text-xl font-serif font-black text-primary">{formatPrice(selectedBooking.totalAmount)}</span>
                                        </div>
                                    </div>
                                </section>

                                {/* Message */}
                                {selectedBooking.message && (
                                    <section className="space-y-4">
                                        <h3 className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('initialMessage')}</h3>
                                        <div className="bg-muted/30 p-4 rounded-xl border border-border italic text-sm text-muted-foreground whitespace-pre-wrap">
                                            {selectedBooking.message}
                                        </div>
                                    </section>
                                )}

                                {/* Restore Action */}
                                <section className="space-y-4 pt-4 border-t border-border">
                                    <h3 className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('actions')}</h3>
                                    <button
                                        onClick={() => restoreBooking(selectedBooking.id)}
                                        className="w-full py-3 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600"
                                    >
                                        <RotateCcw size={16} />
                                        {t('restoreToBookings')}
                                    </button>
                                </section>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
