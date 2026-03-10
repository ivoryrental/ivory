"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, transformImageLink } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ProductGalleryProps {
    images: string[];
    name: string;
}

export const ProductGallery = ({ images, name }: ProductGalleryProps) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const hasImages = images.length > 0;

    const nextImage = () => {
        if (!hasImages) return;
        setSelectedIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        if (!hasImages) return;
        setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!hasImages) {
        return (
            <div className="relative aspect-[4/5] bg-neutral-100 rounded-lg overflow-hidden border flex items-center justify-center text-muted-foreground">
                No Image
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[4/5] bg-neutral-100 rounded-lg overflow-hidden border group">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full relative"
                    >
                        <Image
                            src={transformImageLink(images[selectedIndex])}
                            alt={`${name} - View ${selectedIndex + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority={selectedIndex === 0}
                            referrerPolicy="no-referrer"
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-text-main rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0"
                            aria-label="Previous image"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-text-main rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
                            aria-label="Next image"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {images.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            className={cn(
                                "relative aspect-square rounded-md overflow-hidden border-2 transition-all",
                                selectedIndex === index
                                    ? "border-primary ring-2 ring-primary/20 opacity-100"
                                    : "border-transparent opacity-70 hover:opacity-100"
                            )}
                        >
                            <Image
                                src={transformImageLink(img)}
                                alt={`${name} thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
