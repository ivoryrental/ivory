"use client";

import Image from "next/image";
import { ThemeLink as Link } from "@/components/ui/ThemeLink";
import { ArrowUpRight, ChevronLeft, ChevronRight, ShoppingBag, Check } from "lucide-react";
import { cn, formatPrice, transformImageLink } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useCart } from "@/components/providers/CartProvider";

interface ProductCardProps {
    id: string;
    name: string;
    price: number;
    images: string[];
    category: string;
}

export const ProductCard = ({ id, name, price, images, category }: ProductCardProps) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { addToCart } = useCart();
    const [added, setAdded] = useState(false);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({ id, name, price, image: images[0] });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (images.length > 1) {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (images.length > 1) {
            setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
        }
    };

    const currentImage = images.length > 0 ? transformImageLink(images[currentImageIndex]) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -5 }}
            className="h-full"
        >
            <Link href={`/catalog/${id}`} className="group block h-full">
                <div className="bg-transparent h-full flex flex-col relative">
                    {/* Image Container with organic layering */}
                    <div className="relative aspect-[4/5] mb-4">
                        {/* Background shape */}
                        <div className="absolute top-2 -right-2 w-full h-full bg-accent/20 rounded-none -z-10 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 block" />

                        <div className="w-full h-full bg-white relative border border-neutral-light/50 overflow-hidden group/image">
                            {currentImage ? (
                                <Image
                                    src={currentImage}
                                    alt={name}
                                    fill
                                    className="object-cover transition-transform duration-500"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-main/20 font-bold bg-neutral-50">
                                    IVORY
                                </div>
                            )}

                            {/* Slider Arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full text-text-main opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 shadow-sm z-10"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full text-text-main opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 shadow-sm z-10"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </>
                            )}

                            {/* Quick view overlay */}
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center justify-center">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300 delay-75">
                                    <ArrowUpRight size={20} />
                                </div>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={handleAddToCart}
                                className={cn(
                                    "absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all z-20",
                                    added ? "bg-green-500 text-white" : "bg-white text-primary hover:bg-primary hover:text-white"
                                )}
                            >
                                <AnimatePresence mode="wait">
                                    {added ? (
                                        <motion.div
                                            key="check"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <Check size={20} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="cart"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <ShoppingBag size={20} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col text-center">
                        <p className="text-xs font-bold text-primary/80 uppercase tracking-widest mb-1">
                            {category}
                        </p>
                        <h3 className="text-lg font-serif font-medium text-text-main mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {name}
                        </h3>
                        <span className="font-bold text-lg text-text-main block mt-auto">
                            {formatPrice(price)}
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};
