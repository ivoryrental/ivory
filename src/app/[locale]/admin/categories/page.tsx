"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import { Trash2, Plus, RefreshCw, X, Pencil } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { ImageInput } from "@/components/admin/ImageInput";
import { BulkSelectionBar } from "@/components/admin/BulkSelectionBar";
import { transformImageLink } from "@/lib/utils";
import { useLocalizedNativeValidation } from "@/lib/native-validation";

interface Category {
    id: string;
    name: string;
    name_ka?: string;
    name_ru?: string;
    slug: string;
    image?: string;
}

export default function AdminCategoriesPage() {
    const t = useTranslations("adminCategories");
    const tAdmin = useTranslations("admin");
    const tBulk = useTranslations("adminBulk");
    const locale = useLocale();
    const { handleInvalid, clearValidationMessage } = useLocalizedNativeValidation(locale);

    const [categories, setCategories] = useState<Category[]>([]);
    const [, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const [newItem, setNewItem] = useState<{
        name: string; name_ka: string; name_ru: string;
        slug: string; image: string;
    }>({
        name: "", name_ka: "", name_ru: "",
        slug: "", image: ""
    });

    const normalizeSlug = (value: string) =>
        value
            .toLowerCase()
            .replace(/[\s_]+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

    const fetchCategories = () => {
        setIsLoading(true);
        fetch("/api/categories")
            .then((res) => res.json())
            .then((data) => setCategories(Array.isArray(data) ? data : []))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => categories.some((category) => category.id === id)));
    }, [categories]);

    const handleDelete = async (id: string) => {
        if (!confirm(t("deleteConfirm"))) return;

        try {
            const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
            if (res.ok) {
                setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
                fetchCategories();
            } else {
                alert(t("deleteError"));
            }
        } catch (e) {
            console.error(e);
            alert(t("deleteError"));
        }
    };

    const isAllSelected = categories.length > 0 && selectedIds.length === categories.length;

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        setSelectedIds((prev) =>
            prev.length === categories.length ? [] : categories.map((category) => category.id)
        );
    };

    const bulkMoveToTrash = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(tBulk("confirmMoveToTrash", { count: selectedIds.length, entity: tAdmin("categories") }))) return;

        setIsBulkDeleting(true);
        try {
            const results = await Promise.all(
                selectedIds.map(async (id) => {
                    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
                    return res.ok;
                })
            );

            const failedCount = results.filter((ok) => !ok).length;
            if (failedCount > 0) {
                alert(tBulk("failedMoveToTrash", { count: failedCount }));
            }

            setSelectedIds([]);
            fetchCategories();
        } catch (error) {
            console.error("Bulk category delete failed:", error);
            alert(t("deleteError"));
        } finally {
                setIsBulkDeleting(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditId(category.id);
        setIsEditing(true);
        setNewItem({
            name: category.name,
            name_ka: category.name_ka || "",
            name_ru: category.name_ru || "",
            slug: category.slug,
            image: category.image || ""
        });
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setNewItem({ name: "", name_ka: "", name_ru: "", slug: "", image: "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = isEditing && editId ? `/api/categories/${editId}` : "/api/categories";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem)
            });

            if (res.ok) {
                cancelEdit();
                fetchCategories();
            } else {
                const errorBody = await res.json().catch(() => null);
                if (res.status === 409) {
                    alert(t("slugExists"));
                    return;
                }

                const details = Array.isArray(errorBody?.details) ? errorBody.details as string[] : [];
                const slugFormatError = details.some((detail) =>
                    detail.includes("Slug must be lowercase alphanumeric with hyphens only")
                );
                if (res.status === 400 && slugFormatError) {
                    alert(t("slugFormatError"));
                    return;
                }

                alert(t("saveError"));
            }
        } catch (e) {
            console.error(e);
            alert(t("saveError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-serif text-foreground">{t("title")}</h1>
                <button onClick={fetchCategories} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        {isEditing ? <><Pencil size={18} /> {t("edit")}</> : <><Plus size={18} /> {t("addNew")}</>}
                    </h2>
                    {isEditing && (
                        <button onClick={cancelEdit} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <X size={16} /> {t("form.cancel")}
                        </button>
                    )}
                </div>
                <form
                    onSubmit={handleSubmit}
                    onInvalid={handleInvalid}
                    onInput={clearValidationMessage}
                    onChange={clearValidationMessage}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase">{t("form.nameEn")}</label>
                            <input required className="w-full px-3 py-2 rounded-md border border-input bg-background" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase">{t("form.nameKa")}</label>
                            <input className="w-full px-3 py-2 rounded-md border border-input bg-background" value={newItem.name_ka} onChange={(e) => setNewItem({ ...newItem, name_ka: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase">{t("form.nameRu")}</label>
                            <input className="w-full px-3 py-2 rounded-md border border-input bg-background" value={newItem.name_ru} onChange={(e) => setNewItem({ ...newItem, name_ru: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase">{t("form.slug")}</label>
                            <input
                                required
                                className="w-full px-3 py-2 rounded-md border border-input bg-background"
                                value={newItem.slug}
                                onChange={(e) => setNewItem({ ...newItem, slug: normalizeSlug(e.target.value) })}
                                placeholder="e.g. wedding-decor"
                            />
                            <p className="text-xs text-muted-foreground">{t("form.slugHelp")}</p>
                        </div>
                        <div className="space-y-1">
                            <ImageInput label={t("form.coverImage")} value={newItem.image} onChange={(url) => setNewItem({ ...newItem, image: url })} />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button disabled={isSubmitting} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold hover:opacity-90 disabled:opacity-50">
                            {isSubmitting ? t("form.saving") : (isEditing ? t("form.update") : t("form.save"))}
                        </button>
                    </div>
                </form>
            </div>

            <BulkSelectionBar
                totalCount={categories.length}
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
                    {categories.map((category) => (
                        <div key={category.id} className="rounded-lg border border-border/80 bg-background/50 p-3">
                            <div className="flex items-start gap-3">
                                <label className="pt-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(category.id)}
                                        onChange={() => toggleSelect(category.id)}
                                        className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                                    />
                                </label>
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                                    {category.image ? (
                                        <img src={transformImageLink(category.image)} alt={category.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-[10px] text-gray-500">No Img</div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold leading-tight">{category.name}</p>
                                    {category.name_ka && <p className="mt-0.5 text-xs text-muted-foreground">{category.name_ka}</p>}
                                    <p className="mt-1 text-xs font-mono text-muted-foreground">{category.slug}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-end gap-2">
                                <button onClick={() => handleEdit(category)} className="p-2 hover:bg-muted rounded-md text-primary transition-colors">
                                    <Pencil size={18} />
                                </button>
                                <button onClick={() => handleDelete(category.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-full transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {categories.length === 0 && <div className="py-8 text-center text-muted-foreground">No categories</div>}
                </div>

                <div className="hidden w-full overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] text-left">
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
                                <th className="px-6 py-4 font-bold whitespace-nowrap">{t("table.image")}</th>
                                <th className="px-6 py-4 font-bold min-w-[240px]">{t("table.name")}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap min-w-[180px]">{t("table.slug")}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap text-right min-w-[120px]">{t("table.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {categories.map((category) => (
                                <tr key={category.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-2 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(category.id)}
                                            onChange={() => toggleSelect(category.id)}
                                            className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        {category.image ? (
                                            <div className="w-12 h-12 rounded overflow-hidden bg-neutral-100">
                                                <img src={transformImageLink(category.image)} alt={category.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded bg-neutral-200 flex items-center justify-center text-xs text-gray-500">No Img</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        <div>{category.name}</div>
                                        {category.name_ka && <div className="text-xs text-muted-foreground">{category.name_ka}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{category.slug}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEdit(category)} className="p-2 hover:bg-muted rounded-md text-primary transition-colors"><Pencil size={18} /></button>
                                            <button onClick={() => handleDelete(category.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-full transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No categories</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
