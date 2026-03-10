"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { transformImageLink } from "@/lib/utils";
import NextImage from "next/image";
import { useTranslations } from "next-intl";

interface ImageArrayInputProps {
    values: string[];
    onChange: (values: string[]) => void;
    maxImages?: number;
    pendingUrl: string;
    onPendingUrlChange: (url: string) => void;
}

const SortableItem = ({ url, onRemove }: { url: string; onRemove: () => void }) => {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={url}
            dragListener={false}
            dragControls={dragControls}
            className="flex items-center gap-3 bg-card p-2 rounded border group touch-none"
        >
            <span
                className="text-muted-foreground px-1 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
            >
                <GripVertical size={16} />
            </span>
            <div className="relative w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                <NextImage
                    src={transformImageLink(url)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm truncate text-foreground/90">{url}</p>
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
            >
                <Trash2 size={16} />
            </button>
        </Reorder.Item>
    );
};

export const ImageArrayInput = ({
    values = [],
    onChange,
    maxImages = 25,
    pendingUrl,
    onPendingUrlChange
}: ImageArrayInputProps) => {
    const t = useTranslations("adminShared");
    // Ensure values is always an array
    const images = Array.isArray(values) ? values : [];

    const addImage = () => {
        const trimmedUrl = pendingUrl.trim();
        if (!trimmedUrl) return;

        const finalUrl = transformImageLink(trimmedUrl);

        if (finalUrl === "INVALID_FOLDER_LINK") {
            alert(t('invalidDriveLink'));
            return;
        }

        // If already exists, just clear input
        if (images.includes(finalUrl)) {
            onPendingUrlChange("");
            return;
        }

        if (images.length >= maxImages) {
            alert(t('maxImages', { max: maxImages }));
            return;
        }
        onChange([...images, finalUrl]);
        onPendingUrlChange("");
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        onChange(newImages);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addImage();
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                        type="text"
                        value={pendingUrl}
                        onChange={(e) => onPendingUrlChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        // Auto-add on blur (clicking away) if valid
                        onBlur={() => {
                            if (pendingUrl.trim()) addImage();
                        }}
                        className="w-full min-w-0 flex-1 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder={t('imageUrlPlaceholder')}
                        disabled={images.length >= maxImages}
                    />
                    <button
                        type="button"
                        onClick={addImage}
                        disabled={!pendingUrl.trim() || images.length >= maxImages}
                        className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md font-medium disabled:opacity-50 sm:w-auto sm:shrink-0"
                    >
                        <Plus size={18} /> {t('add')}
                    </button>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                    <span>{t('imagesCount', { current: images.length, max: maxImages })}</span>
                </div>
            </div>

            {images.length > 0 && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-2 bg-muted/20">
                    <Reorder.Group axis="y" values={images} onReorder={onChange} className="space-y-2">
                        {images.map((url, index) => (
                            <SortableItem
                                key={url}
                                url={url}
                                onRemove={() => removeImage(index)}
                            />
                        ))}
                    </Reorder.Group>
                </div>
            )}
        </div>
    );
};
