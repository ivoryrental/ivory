"use client";

import { useState, useEffect } from "react";
import { Product } from "@/lib/types";
import { Trash2, Plus, RefreshCw, X, GripVertical, Save } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { ImageArrayInput } from "@/components/admin/ImageArrayInput";
import { BulkSelectionBar } from "@/components/admin/BulkSelectionBar";
import { normalizeImageLink, transformImageLink, getLocalized, formatPrice } from "@/lib/utils";
import { useLocalizedNativeValidation } from "@/lib/native-validation";
import NextImage from "next/image";

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function AdminProductsPage() {
    const t = useTranslations("adminProduct");
    const tAdmin = useTranslations("admin");
    const tBulk = useTranslations("adminBulk");
    const locale = useLocale();
    const { handleInvalid, clearValidationMessage } = useLocalizedNativeValidation(locale);

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [hasOrderChanged, setHasOrderChanged] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const [newItem, setNewItem] = useState<{
        name: string; name_ka: string; name_ru: string;
        description: string; description_ka: string; description_ru: string;
        price: string; category: string; images: string[]; videoUrl: string;
    }>({
        name: "", name_ka: "", name_ru: "",
        description: "", description_ka: "", description_ru: "",
        price: "", category: "", images: [], videoUrl: ""
    });

    const fetchProducts = () => {
        setIsLoading(true);
        Promise.all([
            fetch("/api/products").then((res) => res.json()),
            fetch("/api/categories").then((res) => res.json())
        ])
            .then(([productsData, categoriesData]) => {
                setProducts(Array.isArray(productsData) ? productsData : []);
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            })
            .catch(() => {
                setProducts([]);
                setCategories([]);
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => products.some((product) => product.id === id)));
    }, [products]);

    const getPrimaryImage = (product: Product): string => {
        try {
            const parsed = JSON.parse(product.images || "[]");
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed[0] as string;
            }
        } catch {
            // Fallback to legacy image field
        }
        return product.image || "";
    };

    const getCategoryLabel = (product: Product & { category?: Category | string }): string => {
        if (typeof product.category === "object" && product.category !== null) {
            const categoryObj = product.category as Category;
            return categoryObj.name || categoryObj.slug;
        }
        return product.category || "";
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("deleteConfirm"))) return;
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (!res.ok) {
            alert(tBulk("failedDeleteItem"));
            return;
        }
        setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
        fetchProducts();
    };

    const isAllSelected = products.length > 0 && selectedIds.length === products.length;

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        setSelectedIds((prev) =>
            prev.length === products.length ? [] : products.map((product) => product.id)
        );
    };

    const bulkMoveToTrash = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(tBulk("confirmMoveToTrash", { count: selectedIds.length, entity: tAdmin("products") }))) return;

        setIsBulkDeleting(true);
        try {
            const results = await Promise.all(
                selectedIds.map(async (id) => {
                    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
                    return res.ok;
                })
            );

            const failedCount = results.filter((ok) => !ok).length;
            if (failedCount > 0) {
                alert(tBulk("failedMoveToTrash", { count: failedCount }));
            }

            setSelectedIds([]);
            fetchProducts();
        } catch (error) {
            console.error("Bulk delete failed:", error);
            alert(tBulk("failedProcessSelected"));
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleEdit = (product: Product & { category?: Category | string }) => {
        setEditId(product.id);
        setIsEditing(true);

        const cat = product.category;
        const categorySlug = cat && typeof cat === "object" ? (cat as Category).slug : (cat as string | undefined) || "";

        let images: string[] = [];
        try {
            const parsed = JSON.parse(product.images || "[]");
            if (Array.isArray(parsed)) images = parsed;
        } catch {
            if (product.image) images = [product.image];
        }

        setNewItem({
            name: product.name,
            name_ka: product.name_ka || "",
            name_ru: product.name_ru || "",
            description: product.description,
            description_ka: product.description_ka || "",
            description_ru: product.description_ru || "",
            price: product.price.toString(),
            category: categorySlug,
            images,
            videoUrl: product.videoUrl || ""
        });
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setNewItem({
            name: "", name_ka: "", name_ru: "",
            description: "", description_ka: "", description_ru: "",
            price: "", category: "", images: [], videoUrl: ""
        });
        setFormResetKey((prev) => prev + 1);
        setPendingImage("");
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

        const reordered = [...products];
        const draggedItem = reordered[draggedIndex];
        reordered.splice(draggedIndex, 1);
        reordered.splice(dropIndex, 0, draggedItem);

        setProducts(reordered);
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
            const updates = products.map((p, index) => ({ id: p.id, sortOrder: index }));

            const res = await fetch("/api/products/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products: updates })
            });

            if (res.ok) {
                setHasOrderChanged(false);
                alert(t("orderSaved"));
            } else {
                alert(t("orderSaveFailed"));
            }
        } catch (error) {
            console.error("Error saving order:", error);
            alert(t("orderSaveFailed"));
        }
    };

    const [pendingImage, setPendingImage] = useState("");
    const [formResetKey, setFormResetKey] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = isEditing && editId ? `/api/products/${editId}` : "/api/products";
            const method = isEditing ? "PUT" : "POST";

            const finalImages = [...newItem.images];
            const trimmedPending = pendingImage.trim();
            if (trimmedPending) {
                const normalizedPending = normalizeImageLink(trimmedPending);
                if (normalizedPending === "INVALID_FOLDER_LINK") {
                    alert("Please use a direct image URL, not a Google Drive folder link.");
                    return;
                }
                if (!finalImages.includes(normalizedPending)) {
                    finalImages.push(normalizedPending);
                }
            }

            const payload = { ...newItem, images: finalImages };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                cancelEdit();
                fetchProducts();
                return;
            }

            const errorData = await res.json().catch(() => null) as { error?: string; details?: string[] } | null;
            const detailMessage = errorData?.details?.length ? `\n${errorData.details.join("\n")}` : "";
            alert(`${errorData?.error || "Failed to save product"}${detailMessage}`);
        } finally {
            setIsSubmitting(false);
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
                    <button onClick={fetchProducts} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        {isEditing ? <><RefreshCw size={18} /> {t("editTitle")}</> : <><Plus size={18} /> {t("addNew")}</>}
                    </h2>
                    {isEditing && (
                        <button onClick={cancelEdit} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <X size={16} /> {t("cancel")}
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
                            <label className="text-xs font-semibold uppercase">{t("name")} (EN)</label>
                            <input required className="w-full px-3 py-2 rounded-md border border-input bg-background" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase">{t("name")} (KA)</label>
                            <input className="w-full px-3 py-2 rounded-md border border-input bg-background" value={newItem.name_ka} onChange={(e) => setNewItem({ ...newItem, name_ka: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase">{t("name")} (RU)</label>
                            <input className="w-full px-3 py-2 rounded-md border border-input bg-background" value={newItem.name_ru} onChange={(e) => setNewItem({ ...newItem, name_ru: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase">{t("description")} (EN)</label>
                            <input required className="w-full px-3 py-2 rounded-md border border-input bg-background" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase">{t("description")} (KA)</label>
                            <input className="w-full px-3 py-2 rounded-md border border-input bg-background" value={newItem.description_ka} onChange={(e) => setNewItem({ ...newItem, description_ka: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase">{t("description")} (RU)</label>
                            <input className="w-full px-3 py-2 rounded-md border border-input bg-background" value={newItem.description_ru} onChange={(e) => setNewItem({ ...newItem, description_ru: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase block">{t("category")}</label>
                            <select required className="w-full px-3 py-2 rounded-md border border-input bg-background" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
                                <option value="">{t("selectCategory")}</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase block">{t("price")}</label>
                            <input type="number" required className="w-full px-3 py-2 rounded-md border border-input bg-background" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase block">{t("videoUrl")}</label>
                            <input className="w-full px-3 py-2 rounded-md border border-input bg-background" placeholder="https://..." value={newItem.videoUrl} onChange={(e) => setNewItem({ ...newItem, videoUrl: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase block">{t("imagesDirectLinks")}</label>
                        <ImageArrayInput
                            key={formResetKey}
                            values={newItem.images}
                            onChange={(imgs) => setNewItem({ ...newItem, images: imgs })}
                            pendingUrl={pendingImage}
                            onPendingUrlChange={setPendingImage}
                            maxImages={25}
                        />
                    </div>

                    <div className="pt-2">
                        <button disabled={isSubmitting} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold hover:opacity-90 disabled:opacity-50">
                            {isSubmitting ? (isEditing ? t("saving") : t("adding")) : (isEditing ? t("saveChanges") : t("addItem"))}
                        </button>
                    </div>
                </form>
            </div>

            <BulkSelectionBar
                totalCount={products.length}
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
                    {products.map((product, index) => {
                        const imageUrl = getPrimaryImage(product);
                        return (
                            <div
                                key={product.id}
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
                                            checked={selectedIds.includes(product.id)}
                                            onChange={() => toggleSelect(product.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                                        />
                                    </label>
                                    <div className="pt-1 text-muted-foreground"><GripVertical size={16} /></div>
                                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                                        {imageUrl ? (
                                            <NextImage
                                                src={transformImageLink(imageUrl)}
                                                alt={getLocalized(product, "name", locale)}
                                                fill
                                                className="object-cover"
                                                sizes="56px"
                                            />
                                        ) : null}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold leading-tight">{getLocalized(product, "name", locale)}</p>
                                        {product.name_ka && <p className="mt-0.5 text-xs text-muted-foreground">{product.name}</p>}
                                        <p className="mt-1 text-xs text-muted-foreground">{t("category")}: {getCategoryLabel(product)}</p>
                                        <p className="text-xs font-semibold text-primary">{formatPrice(product.price)}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-end gap-2">
                                    <button onClick={() => handleEdit(product)} className="rounded-md p-2 text-primary transition-colors hover:bg-muted">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="rounded-full p-2 text-destructive transition-colors hover:bg-destructive/10">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {products.length === 0 && !isLoading && <div className="py-8 text-center text-muted-foreground">{t("noProducts")}</div>}
                </div>

                <div className="hidden w-full overflow-x-auto md:block">
                    <table className="w-full min-w-[860px] text-left">
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
                                <th className="px-6 py-4 font-bold whitespace-nowrap">{t("tableImage")}</th>
                                <th className="px-6 py-4 font-bold min-w-[220px]">{t("name")}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap min-w-[140px]">{t("category")}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap min-w-[110px]">{t("price")}</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap text-right min-w-[120px]">{t("actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {products.map((product, index) => (
                                <tr
                                    key={product.id}
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
                                            checked={selectedIds.includes(product.id)}
                                            onChange={() => toggleSelect(product.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40"
                                        />
                                    </td>
                                    <td className="px-2 py-4 text-muted-foreground"><GripVertical size={18} /></td>
                                    <td className="px-6 py-4">
                                        <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                                            {(() => {
                                                const imgUrl = getPrimaryImage(product);
                                                return imgUrl ? (
                                                    <div className="relative w-full h-full">
                                                        <NextImage
                                                            src={transformImageLink(imgUrl)}
                                                            alt={getLocalized(product, "name", locale)}
                                                            fill
                                                            className="object-cover"
                                                            sizes="48px"
                                                        />
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        <div>{getLocalized(product, "name", locale)}</div>
                                        {product.name_ka && <div className="text-xs text-muted-foreground">{product.name}</div>}
                                    </td>
                                    <td className="px-6 py-4 uppercase text-xs tracking-wider text-muted-foreground">{getCategoryLabel(product)}</td>
                                    <td className="px-6 py-4 font-bold font-mono">{formatPrice(product.price)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEdit(product)} className="p-2 hover:bg-muted rounded-md text-primary transition-colors">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-full transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">{t("noProducts")}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
