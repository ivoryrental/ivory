/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSocialImageUrl } from "@/lib/metadata";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const category = await prisma.category.findFirst({
        where: {
            slug,
            deletedAt: null,
        },
        select: {
            image: true,
        },
    });

    if (!category) {
        notFound();
    }

    const sourceImage = getSocialImageUrl(category.image ?? undefined);

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
