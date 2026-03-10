"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { transformImageLink } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ImageInputProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    className?: string;
}

export const ImageInput = ({ value, onChange, label, className }: ImageInputProps) => {
    const t = useTranslations("adminShared");
    const [imageError, setImageError] = useState(false);

    return (
        <div className={className}>
            {label && <label className="text-sm font-medium mb-2 block">{label}</label>}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* Preview */}
                <div className="relative w-32 h-32 bg-muted rounded-lg overflow-hidden border border-border flex-shrink-0 group">
                    {value ? (
                        <>
                            {!imageError ? (
                                <img
                                    src={transformImageLink(value)}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={() => {
                                        console.error('Image failed to load:', transformImageLink(value));
                                        setImageError(true);
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-destructive bg-destructive/10">
                                    <AlertCircle size={24} className="opacity-70" />
                                    <span className="text-[10px] mt-1 px-2 text-center">{t('invalidUrl')}</span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => { onChange(""); setImageError(false); }}
                                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
                            <ImageIcon size={24} className="opacity-50" />
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-2">
                    <input
                        type="text"
                        placeholder={t('imageUrlPlaceholder')}
                        value={value || ""}
                        onChange={(e) => { onChange(e.target.value); setImageError(false); }}
                        className={`w-full px-3 py-2 rounded-md border bg-background text-sm ${imageError ? 'border-destructive' : 'border-input'}`}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('imageUrlHint')}
                    </p>
                </div>
            </div>
        </div>
    );
};
