"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";

const assets = [
    {
        src: "/images/decor/MONSTERA.webp",
        alt: "Monstera Leaf",
        className: "w-[150px] md:w-[250px] lg:w-[350px] -bottom-[5%] -left-[2%] rotate-12 blur-[1px]",
        depth: 0.15,
        mobileDepth: 25
    },
    {
        src: "/images/decor/LEAFE.webp",
        alt: "Green Leaf",
        className: "w-[100px] md:w-[150px] -top-[2%] -right-[2%] -rotate-45 blur-[0.5px]",
        depth: 0.12,
        mobileDepth: 20
    },
    {
        src: "/images/decor/TULP.webp",
        alt: "Tulip",
        className: "w-[80px] md:w-[120px] top-[30%] -right-[4%] rotate-[-15deg] hidden lg:block blur-[2px]",
        depth: 0.2,
        mobileDepth: 35
    },
    {
        src: "/images/decor/FLOWER.webp",
        alt: "Single Flower",
        className: "w-[100px] md:w-[150px] top-[15%] -left-[4%] rotate-[30deg] blur-[1px]",
        depth: 0.1,
        mobileDepth: 15
    },
    {
        src: "/images/decor/FLOWERS.webp",
        alt: "Flower Bouquet",
        className: "w-[120px] md:w-[200px] -bottom-[2%] -right-[2%] rotate-[-10deg] blur-[1px]",
        depth: 0.18,
        mobileDepth: 30
    },
    {
        src: "/images/decor/LEAFE 2.webp",
        alt: "Leaf Detail",
        className: "w-[60px] md:w-[100px] bottom-[40%] -left-[2%] rotate-45 hidden lg:block blur-[3px]",
        depth: 0.25,
        mobileDepth: 40
    }
];

interface PlantElementProps {
    item: {
        src: string;
        alt: string;
        className: string;
        depth: number;
        mobileDepth: number;
    };
    scrollY: ReturnType<typeof useScroll>['scrollY'];
    smoothMouseX: ReturnType<typeof useSpring>;
    smoothMouseY: ReturnType<typeof useSpring>;
    smoothTiltX: ReturnType<typeof useSpring>;
    smoothTiltY: ReturnType<typeof useSpring>;
    prioritize?: boolean;
}

const PlantElement = ({ item, scrollY, smoothMouseX, smoothMouseY, smoothTiltX, smoothTiltY, prioritize = false }: PlantElementProps) => {
    // Parallax transforms - Now valid as this is a top-level component hook call
    // Increased multipliers for more visible movement
    const yScroll = useTransform(scrollY, [0, 1000], [0, item.depth * 800]);

    // Increased scale for mouse movement
    const x = useTransform(smoothMouseX, [0, 100], [0, item.depth * -200]);
    const y = useTransform(smoothMouseY, [0, 100], [0, item.depth * -200]);

    const mobileX = useTransform(smoothTiltX, (val: number) => val * (item.mobileDepth / 10)); // More sensitive tilt
    const mobileY = useTransform(smoothTiltY, (val: number) => val * (item.mobileDepth / 10));

    // Combine transforms logic manually or via useTransform composition
    // Simplifying to avoid multiple useTransforms for the style object if possible, 
    // but nesting useTransform is fine here.

    // We need to merge these values. `motion` style accepts MotionValues.
    // To add them, we can use useTransform again.
    const finalX = useTransform([x, mobileX], (latest: number[]) => latest.reduce((a, b) => a + b, 0));
    const finalY = useTransform([y, mobileY, yScroll], (latest: number[]) => latest.reduce((a, b) => a + b, 0));

    return (
        <motion.div
            className={`absolute ${item.className} will-change-transform`}
            style={{ x: finalX, y: finalY }}
        >
            <Image
                src={item.src}
                alt={item.alt}
                width={400}
                height={400}
                unoptimized
                className="w-full h-full object-contain opacity-40 decoration-shadow transition-opacity duration-700 hover:opacity-60"
                sizes="(max-width: 768px) 120px, (max-width: 1200px) 200px, 320px"
                {...(prioritize ? { priority: true } : { loading: "lazy" as const })}
            />
        </motion.div>
    );
};

const NatureBackgroundScene = () => {
    const [mounted, setMounted] = useState(false);
    const [, startTransition] = useTransition();

    // Mouse movement state
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Device orientation state (Gyro)
    const tiltX = useMotionValue(0);
    const tiltY = useMotionValue(0);

    // Smooth springs for movement
    const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });
    const smoothTiltX = useSpring(tiltX, { stiffness: 30, damping: 20 });
    const smoothTiltY = useSpring(tiltY, { stiffness: 30, damping: 20 });

    const { scrollY } = useScroll();

    useEffect(() => {
        startTransition(() => {
            setMounted(true);
        });

        // Mouse Move Handler
        const handleMouseMove = (e: MouseEvent) => {
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX - innerWidth / 2) / innerWidth;
            const y = (e.clientY - innerHeight / 2) / innerHeight;
            mouseX.set(x * 100); // reduced multiplier 
            mouseY.set(y * 100);
        };

        // Gyro/Tilt Handler
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.beta !== null && e.gamma !== null) {
                // beta is front/back tilt [-180, 180], gamma is left/right [-90, 90]
                // We clamp and normalize
                const x = Math.min(Math.max(e.gamma, -45), 45); // Left/Right
                const y = Math.min(Math.max(e.beta, -45), 45);  // Front/Back

                tiltX.set(x);
                tiltY.set(y);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);

        // Request permission for iOS 13+ devices might be needed, but we add listener for now
        // Usually orientation works on Android/Desktop(dev tools) without permission
        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", handleOrientation);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("deviceorientation", handleOrientation);
        };
    }, [mouseX, mouseY, tiltX, tiltY]);

    if (!mounted) {
        return null;
    }

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
            {assets.map((item, index) => (
                <PlantElement
                    key={index}
                    item={item}
                    scrollY={scrollY}
                    smoothMouseX={smoothMouseX}
                    smoothMouseY={smoothMouseY}
                    smoothTiltX={smoothTiltX}
                    smoothTiltY={smoothTiltY}
                    prioritize={item.src === "/images/decor/MONSTERA.webp"}
                />
            ))}
        </div>
    );
};

export const NatureBackground = () => {
    const pathname = usePathname();

    if (pathname?.includes("/admin")) {
        return null;
    }

    return <NatureBackgroundScene />;
};
