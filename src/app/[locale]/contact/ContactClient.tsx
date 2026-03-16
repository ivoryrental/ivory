"use client";

import { useTranslations, useLocale } from "next-intl";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { SupportedLocale } from "@/lib/settings-shared";
import { useCart } from "@/components/providers/CartProvider";
import { formatPrice } from "@/lib/utils";
import { useLocalizedNativeValidation } from "@/lib/native-validation";
import { trackMetaEvent } from "@/components/analytics/MetaPixelUtils";

export function ContactClient() {
    const t = useTranslations('common');
    const settings = useSettings();
    const { items, totalPrice, clearCart } = useCart();
    const locale = useLocale() as SupportedLocale;
    const { handleInvalid, clearValidationMessage } = useLocalizedNativeValidation(locale);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({ name: '', email: '', message: '', phone: '' });
    const [, startTransition] = useTransition();

    useEffect(() => {
        if (items.length > 0) {
            const itemsList = items.map(item => `- ${item.name} (x${item.quantity})`).join('\n');
            const prefilledMessage = `${t('orderRequest') || 'Order Request'}:\n${itemsList}\n\nTotal: ${formatPrice(totalPrice)}`;
            startTransition(() => {
                setFormData(prev => ({ ...prev, message: prefilledMessage }));
            });
        }
    }, [items, totalPrice, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    items: items.length > 0 ? items : undefined,
                    totalAmount: items.length > 0 ? totalPrice : undefined
                })
            });

            if (res.ok) {
                trackMetaEvent('Lead', {
                    content_name: 'Contact Form',
                    content_category: items.length > 0 ? 'Order Request' : 'General Inquiry',
                    currency: items.length > 0 ? 'GEL' : undefined,
                    value: items.length > 0 ? totalPrice : undefined,
                    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
                    content_ids: items.map((item) => item.id),
                });
                setStatus('success');
                setFormData({ name: '', email: '', message: '', phone: '' });
                clearCart();
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-serif font-bold text-primary mb-12 text-center">{t('contact')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                <div className="bg-card p-8 rounded-xl border border-border shadow-sm">
                    <h2 className="text-2xl font-bold mb-6">{t('contactUs')}</h2>
                    <ul className="space-y-6">
                        <li className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('phone')}</p>
                                <a href={`tel:${settings.contact.phone}`} className="font-medium text-lg hover:text-primary transition-colors">{settings.contact.phone}</a>
                            </div>
                        </li>
                        <li className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('email') || 'Email'}</p>
                                <a href={`mailto:${settings.contact.email}`} className="font-medium text-lg hover:text-primary transition-colors">{settings.contact.email}</a>
                            </div>
                        </li>
                        <li className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('location') || 'Location'}</p>
                                <span className="font-medium text-lg">{settings.contact.address[locale]}</span>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="bg-card p-8 rounded-xl border border-border shadow-sm">
                    <h2 className="text-2xl font-bold mb-6">{t('contactUs')}</h2>
                    {status === 'success' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-green-50 dark:bg-green-900/10 rounded-lg text-green-600">
                            <Send size={48} className="mb-4" />
                            <h3 className="text-xl font-bold mb-2">{t('messageSent')}</h3>
                            <p>{t('getBackSoon')}</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-6 text-sm underline hover:no-underline"
                            >
                                {t('sendAnother')}
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            onInvalid={handleInvalid}
                            onInput={clearValidationMessage}
                            onChange={clearValidationMessage}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('name') || 'Name'}</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('email') || 'Email'}</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full px-4 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('phone') || 'Phone'}</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('message') || 'Message'}</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>
                            <button
                                disabled={status === 'loading'}
                                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {status === 'loading' ? (t('sending') || 'Sending...') : (t('send') || 'Send')}
                            </button>
                            {status === 'error' && <p className="text-red-500 text-sm text-center">{t('formError') || 'Failed to send message. Try again.'}</p>}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
