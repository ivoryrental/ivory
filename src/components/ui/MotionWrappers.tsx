"use client";

import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";

interface Props {
    children: ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    once?: boolean;
}

export const FadeIn = ({ children, className, delay = 0, duration = 0.5, once = true }: Props) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, margin: "-50px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const SlideUp = ({ children, className, delay = 0, duration = 0.5, once = true }: Props) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, margin: "-50px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const ScaleIn = ({ children, className, delay = 0, duration = 0.5, once = true }: Props) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, margin: "-50px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
