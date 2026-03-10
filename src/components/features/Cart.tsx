"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/components/providers/CartProvider';
import { formatPrice, transformImageLink } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

const PublicCart = () => {
    const { items, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
    const [isOpen, setIsOpen] = useState(false);
    const t = useTranslations('common');
    const router = useRouter();

    if (totalItems === 0 && !isOpen) return null;

    return (
        <>
            {/* Floating FAB */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
            >
                <ShoppingBag size={24} />
                {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#C26196] text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                        {totalItems}
                    </span>
                )}
            </button>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />
                )}
            </AnimatePresence>

            {/* Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-background shadow-2xl z-[70] flex flex-col border-l border-border"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                            <h2 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
                                <ShoppingBag size={20} />
                                {t('cart') || 'Cart'}
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-muted rounded-full transition-colors text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
                                    <ShoppingBag size={48} className="opacity-20" />
                                    <p>{t('cartEmpty') || 'Your cart is empty'}</p>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-primary font-bold hover:underline"
                                    >
                                        {t('continueShopping') || 'Continue Shopping'}
                                    </button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id} className="flex gap-4 group">
                                        <div className="w-20 h-24 bg-muted relative rounded-md overflow-hidden flex-shrink-0 border border-border">
                                            {item.image ? (
                                                <img
                                                    src={transformImageLink(item.image)}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-bold">IVORY</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm truncate mb-1 text-foreground">{item.name}</h3>
                                            <p className="text-primary font-bold text-sm mb-3">{formatPrice(item.price)}</p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center border border-border rounded-md bg-background">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 hover:bg-muted transition-colors text-foreground"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (!isNaN(val)) updateQuantity(item.id, val);
                                                        }}
                                                        className="w-10 text-center text-xs font-bold bg-transparent border-none focus:ring-0 text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 hover:bg-muted transition-colors text-foreground"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-border space-y-4 bg-muted/30 mt-auto">
                                <p className="text-[11px] leading-relaxed text-red-500 font-bold mb-2">
                                    {t('deliveryNotice')}
                                </p>
                                <div className="flex items-center justify-between text-lg">
                                    <span className="font-medium text-muted-foreground">{t('total') || 'Total'}</span>
                                    <span className="font-serif font-bold text-primary text-2xl">
                                        {formatPrice(totalPrice)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        router.push('/contact');
                                    }}
                                    className="w-full py-4 bg-primary text-white font-bold rounded-md hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {t('orderNow') || 'Order Now'}
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <p className="text-[10px] text-center text-muted-foreground italic">
                                    {t('cartNotice') || 'You will be redirected to the contact page to finalize your request.'}
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export const Cart = () => {
    const pathname = usePathname() ?? "";

    if (pathname.includes('/admin')) {
        return null;
    }

    return <PublicCart />;
};
