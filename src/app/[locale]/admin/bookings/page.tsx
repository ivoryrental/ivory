"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { Booking } from "@/lib/types";
import { CheckCircle, XCircle, Clock, Eye, X, Phone, Mail, ShoppingBag, Trash2, History, CheckSquare, Edit2, Save, RotateCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatPrice, cn } from "@/lib/utils";
import { BulkSelectionBar } from "@/components/admin/BulkSelectionBar";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeLink as Link } from "@/components/ui/ThemeLink";

interface BookingItem {
    name: string;
    price: number;
    quantity: number;
}

export default function AdminBookingsPage() {
    const t = useTranslations("adminBookings");
    const tBulk = useTranslations("adminBulk");
    const tCommon = useTranslations("common");
    const tCatalog = useTranslations("catalogPage");
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isEditingMessage, setIsEditingMessage] = useState(false);
    const [editedMessage, setEditedMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isPending, startTransition] = useTransition();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    // Fetch bookings on mount - using useTransition to avoid synchronous setState warnings
    useEffect(() => {
        startTransition(() => {
            setIsLoading(true);
            fetch('/api/bookings?status=active')
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
            fetch('/api/bookings?status=active')
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

    const updateBookingStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                refreshBookings();
                if (selectedBooking?.id === id) {
                    setSelectedBooking(prev => prev ? { ...prev, status: status as Booking['status'] } : null);
                }
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const completeBooking = async (id: string) => {
        if (!confirm('Mark this booking as completed? It will be moved to history.')) return;
        await updateBookingStatus(id, 'completed');
    };

    const startEditingMessage = () => {
        setEditedMessage(selectedBooking?.message || "");
        setIsEditingMessage(true);
    };

    const cancelEditingMessage = () => {
        setIsEditingMessage(false);
        setEditedMessage("");
    };

    const saveMessage = async () => {
        if (!selectedBooking) return;
        
        try {
            const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: editedMessage })
            });
            if (res.ok) {
                setIsEditingMessage(false);
                refreshBookings();
                setSelectedBooking(prev => prev ? { ...prev, message: editedMessage } : null);
            }
        } catch (error) {
            console.error('Failed to update message:', error);
        }
    };

    const deleteBooking = async (id: string) => {
        if (!confirm('Move this booking to trash?')) return;

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
                booking.phone ?? "",
                booking.date,
                booking.dateISO ?? "",
                booking.status,
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

    const bulkUpdateStatus = async (status: Booking["status"], prompt: string) => {
        if (selectedIds.length === 0) return;
        if (!confirm(prompt)) return;

        setIsBulkProcessing(true);
        try {
            const results = await Promise.all(
                selectedIds.map(async (id) => {
                    const res = await fetch(`/api/bookings/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status })
                    });
                    return res.ok;
                })
            );

            const failedCount = results.filter((ok) => !ok).length;
            if (failedCount > 0) {
                alert(tBulk("failedUpdateBookings", { count: failedCount }));
            }

            if (selectedBooking && selectedIds.includes(selectedBooking.id)) {
                setSelectedBooking(null);
            }

            setSelectedIds([]);
            refreshBookings();
        } catch (error) {
            console.error("Bulk status update failed:", error);
            alert(tBulk("failedProcessSelected"));
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const bulkDeleteBookings = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Move ${selectedIds.length} selected booking(s) to trash?`)) return;

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
                alert(tBulk("failedDeleteBookings", { count: failedCount }));
            }

            if (selectedBooking && selectedIds.includes(selectedBooking.id)) {
                setSelectedBooking(null);
            }

            setSelectedIds([]);
            refreshBookings();
        } catch (error) {
            console.error("Bulk delete failed:", error);
            alert(tBulk("failedDeleteSelectedBookings"));
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <CheckCircle size={16} className="text-green-500" />;
            case 'pending': return <Clock size={16} className="text-amber-500" />;
            case 'cancelled': return <XCircle size={16} className="text-red-500" />;
            case 'completed': return <CheckSquare size={16} className="text-blue-500" />;
            default: return null;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold font-serif text-foreground">{t('title')}</h1>
                <Link
                    href="/admin/bookings/history"
                    className="inline-flex items-center gap-2 self-start px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors sm:self-auto"
                >
                    <History size={18} />
                    {t('viewHistory')}
                </Link>
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
                    {t('table.id')} • {t('table.customer')} • {tCommon('email')} • {t('table.date')} • {t('table.status')} • {t('table.total')}
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
                            onClick={() => bulkUpdateStatus("confirmed", tBulk("confirmSetStatus", { count: selectedIds.length, status: tBulk("statusConfirmed") }))}
                            disabled={selectedIds.length === 0 || isBulkProcessing}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {tBulk("confirmAction")}
                        </button>
                        <button
                            type="button"
                            onClick={() => bulkUpdateStatus("cancelled", tBulk("confirmSetStatus", { count: selectedIds.length, status: tBulk("statusCancelled") }))}
                            disabled={selectedIds.length === 0 || isBulkProcessing}
                            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                        >
                            {tBulk("cancelAction")}
                        </button>
                        <button
                            type="button"
                            onClick={() => bulkUpdateStatus("completed", tBulk("confirmSetStatus", { count: selectedIds.length, status: tBulk("statusCompleted") }))}
                            disabled={selectedIds.length === 0 || isBulkProcessing}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {tBulk("completeAction")}
                        </button>
                        <button
                            type="button"
                            onClick={bulkDeleteBookings}
                            disabled={selectedIds.length === 0 || isBulkProcessing}
                            className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                        >
                            {tBulk("deleteAction")}
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
                                    <p className="mt-1 text-xs text-muted-foreground">{booking.date}</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1 text-[10px] font-black uppercase">
                                        {getStatusIcon(booking.status)}
                                        {booking.status}
                                    </div>
                                    <p className="mt-1 text-sm font-bold text-primary">{formatPrice(booking.totalAmount)}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setSelectedBooking(booking)}
                                    className="p-2 hover:bg-muted rounded-full transition-colors text-primary"
                                    title="View Details"
                                >
                                    <Eye size={18} />
                                </button>
                                {booking.status === 'confirmed' && (
                                    <button
                                        onClick={() => completeBooking(booking.id)}
                                        className="p-2 hover:bg-blue-500/10 rounded-full transition-colors text-blue-500"
                                        title="Mark as Completed"
                                    >
                                        <CheckSquare size={18} />
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteBooking(booking.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-red-500"
                                    title="Move to Trash"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hidden w-full overflow-x-auto md:block">
                    <table className="w-full min-w-[980px] text-left">
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
                                <th className="px-6 py-4 font-bold min-w-[260px]">{t('table.customer')}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap min-w-[140px]">{t('table.date')}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap min-w-[130px]">{t('table.status')}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap text-right min-w-[130px]">{t('table.total')}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap text-center min-w-[140px]">{t('actions')}</th>
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
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 uppercase text-[10px] font-black">
                                            {getStatusIcon(booking.status)}
                                            {booking.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-right text-primary">{formatPrice(booking.totalAmount)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setSelectedBooking(booking)}
                                                className="p-2 hover:bg-muted rounded-full transition-colors text-primary"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {booking.status === 'confirmed' && (
                                                <button
                                                    onClick={() => completeBooking(booking.id)}
                                                    className="p-2 hover:bg-blue-500/10 rounded-full transition-colors text-blue-500"
                                                    title="Mark as Completed"
                                                >
                                                    <CheckSquare size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteBooking(booking.id)}
                                                className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-red-500"
                                                title="Move to Trash"
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
                        <p>{bookings.length === 0 ? "No active bookings" : t('noBookings')}</p>
                        <p className="text-sm">
                            {bookings.length === 0
                                ? "All bookings are in history"
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
                                    <h2 className="text-xl font-serif font-bold text-primary">Booking Details</h2>
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
                                {/* Customer Info */}
                                <section className="space-y-4">
                                    <h3 className="text-xs uppercase font-black text-muted-foreground tracking-widest">Customer</h3>
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
                                    <h3 className="text-xs uppercase font-black text-muted-foreground tracking-widest">Items</h3>
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
                                            <span className="font-bold">Total Amount</span>
                                            <span className="text-xl font-serif font-black text-primary">{formatPrice(selectedBooking.totalAmount)}</span>
                                        </div>
                                    </div>
                                </section>

                                {/* Message */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs uppercase font-black text-muted-foreground tracking-widest">Initial Message</h3>
                                        {!isEditingMessage ? (
                                            <button
                                                onClick={startEditingMessage}
                                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                                            >
                                                <Edit2 size={14} />
                                                Edit
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={saveMessage}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-500/10 rounded transition-colors"
                                                >
                                                    <Save size={14} />
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEditingMessage}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted rounded transition-colors"
                                                >
                                                    <RotateCcw size={14} />
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {!isEditingMessage ? (
                                        <div className="bg-muted/30 p-4 rounded-xl border border-border italic text-sm text-muted-foreground whitespace-pre-wrap min-h-[60px]">
                                            {selectedBooking.message || <span className="text-muted-foreground/50">No message</span>}
                                        </div>
                                    ) : (
                                        <textarea
                                            value={editedMessage}
                                            onChange={(e) => setEditedMessage(e.target.value)}
                                            className="w-full p-4 rounded-xl border border-border bg-background text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="Add notes about additional items, changes, etc..."
                                        />
                                    )}
                                </section>

                                {/* Status Management */}
                                <section className="space-y-4 pt-4">
                                    <h3 className="text-xs uppercase font-black text-muted-foreground tracking-widest">Update Status</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                                            disabled={selectedBooking.status === 'confirmed'}
                                            className={cn(
                                                "flex-1 min-w-[100px] py-3 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2",
                                                selectedBooking.status === 'confirmed'
                                                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                                    : "bg-green-500 text-white hover:bg-green-600"
                                            )}
                                        >
                                            <CheckCircle size={16} />
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                                            disabled={selectedBooking.status === 'cancelled'}
                                            className={cn(
                                                "flex-1 min-w-[100px] py-3 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2",
                                                selectedBooking.status === 'cancelled'
                                                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                                    : "bg-red-500 text-white hover:bg-red-600"
                                            )}
                                        >
                                            <XCircle size={16} />
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => completeBooking(selectedBooking.id)}
                                            disabled={selectedBooking.status === 'completed'}
                                            className={cn(
                                                "flex-1 min-w-[100px] py-3 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2",
                                                selectedBooking.status === 'completed'
                                                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                            )}
                                        >
                                            <CheckSquare size={16} />
                                            Complete
                                        </button>
                                    </div>
                                </section>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
