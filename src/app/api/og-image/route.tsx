/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { baseUrl, getSocialImageUrl } from "@/lib/metadata";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(request: NextRequest) {
    const source = request.nextUrl.searchParams.get("url") ?? undefined;
    const imageUrl = getSocialImageUrl(source);

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    background: "#f7f3ee",
                }}
            >
                <img
                    src={imageUrl.startsWith("http") ? imageUrl : `${baseUrl}${imageUrl}`}
                    alt=""
                    width={WIDTH}
                    height={HEIGHT}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            </div>
        ),
        {
            width: WIDTH,
            height: HEIGHT,
            headers: {
                "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
            },
        }
    );
}
