"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Pencil, Trash2, X, Image as ImageIcon, GripVertical, Save, RefreshCw } from "lucide-react";
import { ImageArrayInput } from "@/components/admin/ImageArrayInput";
import { BulkSelectionBar } from "@/components/admin/BulkSelectionBar";
import { transformImageLink, getLocalized } from "@/lib/utils";
import { useLocalizedNativeValidation } from "@/lib/native-validation";

interface ServiceFromAPI {
    id: string;
    title: string;
    title_ka?: string;
    title_ru?: string;
    description: string;
    description_ka?: string;
    description_ru?: string;
    image?: string;
    images?: string;
    sortOrder?: number;
    videoUrl?: string;
}

interface Service {
    id: string;
    title: string;
    title_ka?: string;
    title_ru?: string;
    description: string;
    description_ka?: string;
    description_ru?: string;
    image?: string;
    images: string[];
    sortOrder: number;
    videoUrl?: string;
}

function parseServicesFromApi(data: ServiceFromAPI[]): Service[] {
    return data.map((service, index) => {
        let images: string[] = [];
        try {
            images = service.images ? JSON.parse(service.images) : (service.image ? [service.image] : []);
        } catch {
            images = service.image ? [service.image] : [];
        }

        return {
            ...service,
            images,
            sortOrder: service.sortOrder ?? index
        };
    });
}

export default function AdminServicesPage() {
    const t = useTranslations("adminServices");
    const tAdmin = useTranslations("admin");
    const tBulk = useTranslations("adminBulk");
    const locale = useLocale();
    const { handleInvalid, clearValidationMessage } = useLocalizedNativeValidation(locale);
    const [services, setServices] = useState<Service[]>([]);
    const [, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<Service>>({ images: [] });
    const [pendingImage, setPendingImage] = useState("");
    const [, startTransition] = useTransition();
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [hasOrderChanged, setHasOrderChanged] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    useEffect(() => {
        startTransition(() => {
            setIsLoading(true);
            fetch("/api/services")
                .then((res) => res.json())
                .then((data: ServiceFromAPI[]) => {
                    setServices(parseServicesFromApi(Array.isArray(data) ? data : []));
                    setHasOrderChanged(false);
                })
                .finally(() => setIsLoading(false));
        });
    }, []);

    useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => services.some((service) => service.id === id)));
    }, [services]);

    const refreshServices = () => {
        startTransition(() => {
            setIsLoading(true);
            fetch("/api/services")
                .then((res) => res.json())
                .then((data: ServiceFromAPI[]) => {
                    setServices(parseServicesFromApi(Array.isArray(data) ? data : []));
                    setHasOrderChanged(false);
                })
                .finally(() => setIsLoading(false));
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = currentService.id ? `/api/services/${currentService.id}` : "/api/services";
        const method = currentService.id ? "PUT" : "POST";

        const finalImages = [...(currentService.images || [])];
        const trimmedPending = pendingImage.trim();
        if (trimmedPending) {
            const transformedPending = transformImageLink(trimmedPending);
            if (!finalImages.includes(transformedPending)) {
                finalImages.push(transformedPending);
            }
        }

        const payload = {
            ...currentService,
            images: finalImages
        };

        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        setIsEditing(false);
        setCurrentService({ images: [] });
        setPendingImage("");
        refreshServices();
    };

    const handleDelete = async (id: string) => {
        if (confirm(t("deleteConfirm"))) {
            const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
            if (!res.ok) {
                alert(tBulk("failedDeleteItem"));
                return;
            }
            setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
            refreshServices();
        }
    };

    const isAllSelected = services.length > 0 && selectedIds.length === services.length;

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        setSelectedIds((prev) =>
            prev.length === services.length ? [] : services.map((service) => service.id)
        );
    };

    const bulkMoveToTrash = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(tBulk("confirmMoveToTrash", { count: selectedIds.length, entity: tAdmin("services") }))) return;

        setIsBulkDeleting(true);
        try {
            const results = await Promise.all(
                selectedIds.map(async (id) => {
                    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
                    return res.ok;
                })
            );

            const failedCount = results.filter((ok) => !ok).length;
            if (failedCount > 0) {
                alert(tBulk("failedMoveToTrash", { count: failedCount }));
            }

            setSelectedIds([]);
            refreshServices();
        } catch (error) {
            console.error("Bulk service delete failed:", error);
            alert(tBulk("failedProcessSelected"));
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const openEdit = (service: Service) => {
        setCurrentService({ ...service });
        setPendingImage("");
        setIsEditing(true);
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const reordered = [...services];
        const draggedItem = reordered[draggedIndex];
        reordered.splice(draggedIndex, 1);
        reordered.splice(dropIndex, 0, draggedItem);

        setServices(reordered);
        setHasOrderChanged(true);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const saveOrder = async () => {
        try {
            const updates = services.map((service, index) => ({
                id: service.id,
                sortOrder: index
            }));

            const res = await fetch("/api/services/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ services: updates })
            });

            if (res.ok) {
                setHasOrderChanged(false);
                alert(t("orderSaved"));
                refreshServices();
            } else {
                alert(t("orderSaveFailed"));
            }
        } catch (error) {
            console.error("Error saving order:", error);
            alert(t("orderSaveFailed"));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold font-serif text-foreground">{t("title")}</h1>
                <div className="flex items-center justify-end gap-2">
                    {hasOrderChanged && (
                        <button
                            onClick={saveOrder}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                        >
                            <Save size={18} />
                            {t("saveOrder")}
                        </button>
                    )}
                    <button onClick={refreshServices} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <RefreshCw size={20} />
                    </button>
                    <button
                        onClick={() => { setCurrentService({ images: [] }); setPendingImage(""); setIsEditing(true); }}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus size={20} /> {t("addNew")}
                    </button>
                </div>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{currentService.id ? t("edit") : t("addNew")}</h2>
                            <button onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={24} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            onInvalid={handleInvalid}
                            onInput={clearValidationMessage}
                            onChange={clearValidationMessage}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("form.titleEn")}</label>
                                    <input required value={currentService.title || ""} onChange={(e) => setCurrentService({ ...currentService, title: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("form.titleKa")}</label>
                                    <input value={currentService.title_ka || ""} onChange={(e) => setCurrentService({ ...currentService, title_ka: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("form.titleRu")}</label>
                                    <input value={currentService.title_ru || ""} onChange={(e) => setCurrentService({ ...currentService, title_ru: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("form.descEn")}</label>
                                    <textarea required value={currentService.description || ""} onChange={(e) => setCurrentService({ ...currentService, description: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background min-h-[100px]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("form.descKa")}</label>
                                    <textarea value={currentService.description_ka || ""} onChange={(e) => setCurrentService({ ...currentService, description_ka: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background min-h-[100px]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("form.descRu")}</label>
                                    <textarea value={currentService.description_ru || ""} onChange={(e) => setCurrentService({ ...currentService, description_ru: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background min-h-[100px]" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("form.imageUrl")}</label>
                                    <ImageArrayInput values={currentService.images || []} onChange={(imgs) => setCurrentService({ ...currentService, images: imgs })} pendingUrl={pendingImage} onPendingUrlChange={setPendingImage} maxImages={25} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("videoUrl")}</label>
                                    <input value={currentService.videoUrl || ""} onChange={(e) => setCurrentService({ ...currentService, videoUrl: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background" placeholder="https://..." />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded-md hover:bg-muted transition-colors">{t("form.cancel")}</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">{t("form.save")}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <BulkSelectionBar
                totalCount={services.length}
                selectedCount={selectedIds.length}
                allSelected={isAllSelected}
                onToggleSelectAll={toggleSelectAll}
                onClearSelection={() => setSelectedIds([])}
                selectAllLabel={tBulk("selectAll")}
                selectedLabel={tBulk("selected")}
                clearLabel={tBulk("clear")}
                actions={
                    <button
                        type="button"
                        onClick={bulkMoveToTrash}
                        disabled={selectedIds.length === 0 || isBulkDeleting}
                        className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                    >
                        {isBulkDeleting ? tBulk("moving") : tBulk("moveToTrash")}
                    </button>
                }
            />

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="space-y-3 p-3 md:hidden">
                    {services.map((service, index) => (
                        <div
                            key={service.id}
                            className={`rounded-lg border border-border/80 bg-background/50 p-3 ${draggedIndex === index ? "opacity-50" : ""}`}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex items-start gap-3">
                                <label className="pt-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(service.id)}
                                        onChange={() => toggleSelect(service.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                                    />
                                </label>
                                <div className="pt-1 text-muted-foreground"><GripVertical size={16} /></div>
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                                    {service.images && service.images.length > 0 ? (
                                        <img
                                            src={transformImageLink(service.images[0])}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} className="text-muted-foreground" /></div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold leading-tight">{getLocalized(service, "title", locale)}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{getLocalized(service, "description", locale)}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-end gap-2">
                                <button onClick={() => openEdit(service)} className="p-2 hover:bg-muted rounded-md text-primary transition-colors"><Pencil size={16} /></button>
                                <button onClick={() => handleDelete(service.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-md transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                    {services.length === 0 && <div className="py-8 text-center text-muted-foreground">{t("noServices")}</div>}
                </div>

                <div className="hidden w-full overflow-x-auto md:block">
                    <table className="w-full min-w-[900px] text-left">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase">
                            <tr>
                                <th className="px-2 py-4 font-bold whitespace-nowrap w-10">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                                    />
                                </th>
                                <th className="px-2 py-4 font-bold whitespace-nowrap w-8"></th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap w-20">{t("table.image")}</th>
                                <th className="px-6 py-4 font-bold min-w-[220px]">{t("table.title")}</th>
                                <th className="px-6 py-4 font-bold min-w-[280px]">{t("table.description")}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap text-right min-w-[120px]">{t("table.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {services.map((service, index) => (
                                <tr
                                    key={service.id}
                                    className={`hover:bg-muted/30 transition-colors cursor-move ${dragOverIndex === index ? "border-t-2 border-primary" : ""} ${draggedIndex === index ? "opacity-50" : ""}`}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <td className="px-2 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(service.id)}
                                            onChange={() => toggleSelect(service.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                                        />
                                    </td>
                                    <td className="px-2 py-4 text-muted-foreground"><GripVertical size={18} /></td>
                                    <td className="px-6 py-4">
                                        {service.images && service.images.length > 0 ? (
                                            <div className="relative">
                                                <img
                                                    src={transformImageLink(service.images[0])}
                                                    alt=""
                                                    className="w-10 h-10 object-cover rounded-md"
                                                    referrerPolicy="no-referrer"
                                                />
                                                {service.images.length > 1 && (
                                                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{service.images.length}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center"><ImageIcon size={16} className="text-muted-foreground" /></div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        <div>{getLocalized(service, "title", locale)}</div>
                                        <div className="text-xs text-muted-foreground">{service.title}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground line-clamp-2 max-w-md">{getLocalized(service, "description", locale)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(service)} className="p-2 hover:bg-muted rounded-md text-primary transition-colors"><Pencil size={16} /></button>
                                            <button onClick={() => handleDelete(service.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-md transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {services.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">{t("noServices")}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
