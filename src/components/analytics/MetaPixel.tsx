"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { META_PIXEL_ID, trackMetaEvent } from "@/components/analytics/MetaPixelUtils";

interface MetaPixelProps {
    nonce?: string;
}

export function MetaPixel({ nonce }: MetaPixelProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const hasTrackedInitialPage = useRef(false);
    const isAdminRoute = !pathname || pathname.split("/").includes("admin");
    const search = searchParams.toString();

    useEffect(() => {
        if (isAdminRoute) {
            return;
        }

        if (!hasTrackedInitialPage.current) {
            hasTrackedInitialPage.current = true;
            return;
        }

        trackMetaEvent("PageView");
    }, [isAdminRoute, pathname, search]);

    if (isAdminRoute) {
        return null;
    }

    return (
        <>
            <Script
                id="meta-pixel"
                nonce={nonce}
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
                    `,
                }}
            />
            <noscript>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                    alt=""
                />
            </noscript>
        </>
    );
}
