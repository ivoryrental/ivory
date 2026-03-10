import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 375 375"
            className={cn("w-12 h-12", className)}
            fill="currentColor"
        >
            <defs>
                <clipPath id="a">
                    <path d="M.6 50h173.8v22H.6z" />
                </clipPath>
                <clipPath id="b">
                    <path d="M.6 105h173.8v22H.6z" />
                </clipPath>
                <clipPath id="c">
                    <path d="M22 .1h74v174.7H22z" />
                </clipPath>
                <clipPath id="d">
                    <path d="M80 .1h74v174.7H80z" />
                </clipPath>
            </defs>
            <g transform="translate(21 100)">
                <path
                    d="M163.7 71.5H11.4C5.6 71.5 1 66.8 1 61.1c0-5.7 4.6-10.4 10.4-10.4h152.3c5.7 0 10.4 4.6 10.4 10.4 0 5.7-4.7 10.4-10.4 10.4"
                    clipPath="url(#a)"
                />
                <path
                    d="M163.7 126.4H11.4C5.6 126.4 1 121.7 1 116c0-5.7 4.6-10.4 10.4-10.4h152.3c5.7 0 10.4 4.6 10.4 10.4 0 5.8-4.7 10.4-10.4 10.4"
                    clipPath="url(#b)"
                />
                <path
                    d="M32.7 174.5c-1.1 0-2.3-.2-3.4-.6-5.4-1.9-8.3-7.8-6.4-13.2L75.4 7.5c1.9-5.4 7.8-8.3 13.2-6.4 5.4 1.9 8.3 7.8 6.4 13.2L42.5 167.5c-1.4 4.3-5.5 7-9.8 7"
                    clipPath="url(#c)"
                />
                <path
                    d="M90.5 174.5c-1.1 0-2.3-.2-3.4-.6-5.4-1.9-8.3-7.8-6.4-13.2L133.2 7.5c1.9-5.4 7.8-8.3 13.2-6.4 5.4 1.9 8.3 7.8 6.4 13.2L100.3 167.5c-1.5 4.3-5.5 7-9.8 7"
                    clipPath="url(#d)"
                />
            </g>
        </svg>
    );
};
