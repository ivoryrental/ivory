/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSocialImageUrl } from "@/lib/metadata";
import { safeJsonParse } from "@/lib/utils";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const product = await prisma.product.findFirst({
        where: {
            id,
            deletedAt: null,
        },
        select: {
            images: true,
        },
    });

    if (!product) {
        notFound();
    }

    const images = safeJsonParse<string[]>(product.images, []);
    const sourceImage = getSocialImageUrl(images[0]);

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
                    src={sourceImage}
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
