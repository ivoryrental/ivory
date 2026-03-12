"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ui/ProductCard";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";

interface Category {
    id: string;
    name: string;
    name_ka?: string | null;
    name_ru?: string | null;
    slug: string;
}

interface Product {
    id: string;
    name: string;
    name_ka?: string | null; // Add optional localized fields
    name_ru?: string | null;
    price: number;
    images: string;
    category: {
        name: string;
        name_ka?: string | null;
        name_ru?: string | null;
        slug: string;
    };
}

interface CatalogClientProps {
    initialProducts: Product[];
    categories: Category[];
    locale: string;
    totalProducts: number;
    currentPage: number;
    productsPerPage: number;
}

export const CatalogClient = ({
    initialProducts,
    categories,
    locale,
    totalProducts,
    currentPage,
    productsPerPage
}: CatalogClientProps) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('catalogPage');

    const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "all");
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const canUsePortal = typeof document !== "undefined";

    useEffect(() => {
        if (!canUsePortal) return;

        document.body.style.overflow = isMobileFiltersOpen ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [canUsePortal, isMobileFiltersOpen]);

    // Sync debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Update URL on debounced query change
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (debouncedQuery) {
            params.set("search", debouncedQuery);
        } else {
            params.delete("search");
        }

        // Only push if changed to avoid loops or unnecessary pushes
        if (params.toString() !== searchParams.toString()) {
            params.delete("page"); // Reset grid to page 1
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [debouncedQuery, pathname, router, searchParams]);

    // Update URL when category changes
    const updateCategory = (category: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (category === "all") {
            params.delete("category");
        } else {
            params.set("category", category);
        }
        // Preserve search if any
        if (searchQuery) params.set("search", searchQuery);

        params.delete("page"); // Reset grid to page 1
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
        setSelectedCategory(category);
    };

    const updatePage = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`${pathname}?${params.toString()}`, { scroll: true });
    };

    // Client-side search filtering (only filters the *current page* results unless we move search to server too)
    // IMPORTANT: For full server-side search, we'd need to update the URL with ?q=... and handle it in page.tsx
    // For now, let's keep search client-side for immediate feedback on the visible set, or clarify requirement.
    // Given the audit report's emphasis on pagination, let's assume filtering the currently fetched page is acceptable OR 
    // we should ideally push search to URL. Let's make search server-side to be consistent.



    // Parse images JSON safely
    const getImages = (jsonImages: string): string[] => {
        try {
            const images = JSON.parse(jsonImages);
            return Array.isArray(images) ? images : [];
        } catch {
            return [];
        }
    };

    // Use initialProducts directly as they are now the paginated slice
    const displayedProducts = initialProducts;

    const filtersContent = (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold text-text-main mb-4">{t('categories')}</h3>
                <ul className="space-y-2">
                    <li>
                        <button
                            onClick={() => { updateCategory("all"); setIsMobileFiltersOpen(false); }}
                            className={cn(
                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                selectedCategory === "all"
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-gray-600 hover:bg-neutral-50"
                            )}
                        >
                            {t('all')}
                        </button>
                    </li>
                    {categories.map((cat) => {
                        const catName = cat[`name_${locale}` as keyof Category] as string | undefined || cat.name;
                        return (
                            <li key={cat.id}>
                                <button
                                    onClick={() => { updateCategory(cat.slug); setIsMobileFiltersOpen(false); }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                        selectedCategory === cat.slug
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-gray-600 hover:bg-neutral-50"
                                    )}
                                >
                                    {catName}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row lg:items-start gap-8 relative mt-4 lg:mt-0">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4 flex gap-4 sticky top-[57px] z-40 bg-background/95 py-4"> {/* Made search sticky */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t('search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-card border border-neutral-light rounded-xl focus:outline-none focus:border-primary transition-colors"
                    />
                </div>
                <button
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="px-4 py-3 bg-card border border-neutral-light rounded-xl flex items-center gap-2 text-text-main hover:border-primary transition-colors"
                >
                    <SlidersHorizontal size={20} />
                </button>
            </div>

            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block lg:sticky lg:top-[112px] lg:h-fit lg:w-[250px] lg:flex-shrink-0">
                <div className="relative mb-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-card border border-neutral-light rounded-lg focus:outline-none focus:border-primary transition-all text-sm"
                    />
                </div>
                {filtersContent}
            </aside>

            {/* Mobile Filters Drawer */}
            {canUsePortal && isMobileFiltersOpen && createPortal(
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] lg:hidden"
                        onClick={() => setIsMobileFiltersOpen(false)}
                    />
                    <aside className="fixed inset-y-0 left-0 z-[1101] w-[280px] max-w-[86vw] bg-background p-6 shadow-2xl lg:hidden overflow-y-auto">
                        <div className="flex items-center justify-between mb-8 pt-4">
                            <h2 className="text-xl font-bold font-serif text-text-main">{t('filters')}</h2>
                            <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2">
                                <X size={24} />
                            </button>
                        </div>
                        {filtersContent}
                    </aside>
                </>,
                document.body
            )}

            {/* Product Grid */}
            <main className="flex-1">
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-gray-500 text-sm">{t('found', { count: displayedProducts.length })}</p>
                </div>

                {displayedProducts.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-12">
                            {displayedProducts.map((product) => {
                                // Logic to get localized name
                                const localizedName = product[`name_${locale}` as keyof Product] as string | undefined || product.name;
                                const localizedCategory = product.category[`name_${locale}` as keyof Product['category']] as string | undefined || product.category.name;

                                return (
                                    <ProductCard
                                        key={product.id}
                                        id={product.id}
                                        name={localizedName}
                                        price={product.price}
                                        images={getImages(product.images)}
                                        category={localizedCategory}
                                    />
                                );
                            })}
                        </div>

                        {/* Pagination Controls */}
                        {Math.ceil(totalProducts / productsPerPage) > 1 && (
                            <div className="flex justify-center items-center gap-4 py-8">
                                <button
                                    disabled={currentPage <= 1}
                                    onClick={() => updatePage(currentPage - 1)}
                                    className="px-4 py-2 border border-border rounded-lg bg-white disabled:opacity-50 hover:bg-neutral-50 transition-colors text-sm font-medium"
                                >
                                    {t('prev')}
                                </button>
                                <span className="text-sm font-medium text-muted-foreground">
                                    {t('pageOf', { current: currentPage, total: Math.ceil(totalProducts / productsPerPage) })}
                                </span>
                                <button
                                    disabled={currentPage >= Math.ceil(totalProducts / productsPerPage)}
                                    onClick={() => updatePage(currentPage + 1)}
                                    className="px-4 py-2 border border-border rounded-lg bg-white disabled:opacity-50 hover:bg-neutral-50 transition-colors text-sm font-medium"
                                >
                                    {t('next')}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-xl text-gray-400 font-medium mb-2">{t('noProducts')}</p>
                        <button
                            onClick={() => { setSearchQuery(""); setSelectedCategory("all"); updateCategory("all"); }}
                            className="text-primary hover:underline text-sm"
                        >
                            {t('clearFilters')}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};
