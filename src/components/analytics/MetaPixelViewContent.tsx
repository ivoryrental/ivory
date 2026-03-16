"use client";

import { useEffect, useRef } from "react";
import { trackMetaEvent } from "@/components/analytics/MetaPixelUtils";

interface MetaPixelViewContentProps {
    productId: string;
    name: string;
    category: string;
    price: number;
    currency?: string;
}

export function MetaPixelViewContent({
    productId,
    name,
    category,
    price,
    currency = "GEL",
}: MetaPixelViewContentProps) {
    const lastTrackedProductId = useRef<string | null>(null);

    useEffect(() => {
        if (lastTrackedProductId.current === productId) {
            return;
        }

        lastTrackedProductId.current = productId;

        trackMetaEvent("ViewContent", {
            content_ids: [productId],
            content_name: name,
            content_category: category,
            content_type: "product",
            value: price,
            currency,
        });
    }, [category, currency, name, price, productId]);

    return null;
}
