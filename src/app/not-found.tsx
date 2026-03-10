"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <h1 className="text-9xl font-serif font-bold text-primary/20 mb-4">404</h1>
            <h2 className="text-3xl font-serif font-bold text-text-main mb-6">გვერდი ვერ მოიძებნა</h2>
            <p className="text-gray-500 max-w-md mb-10">
                სამწუხაროდ მითითებული გვერდი არ არსებობს ან წაშლილია.
            </p>
            <Link
                href="/"
                className="px-8 py-3 bg-primary text-white font-medium hover:bg-primary/90 transition-all flex items-center gap-2"
            >
                მთავარზე დაბრუნება <ArrowRight size={18} />
            </Link>
        </div>
    );
}
