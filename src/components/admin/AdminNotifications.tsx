"use client";

import { Bell } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AdminNotifications() {
    const [unseenCount, setUnseenCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const [, startTransition] = useTransition();

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/admin/notifications');
            if (res.ok) {
                const data = await res.json();
                startTransition(() => {
                    setUnseenCount(data.unseenCount);
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const markSeen = async () => {
        setIsOpen(!isOpen);
        if (unseenCount > 0 && !isOpen) {
            try {
                await fetch('/api/admin/notifications', { method: 'POST' });
                setUnseenCount(0);
                router.refresh();
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <div className="relative">
            <button
                onClick={markSeen}
                className="p-2 hover:bg-muted rounded-full relative"
            >
                <Bell size={20} />
                {unseenCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                        {unseenCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border shadow-lg rounded-xl p-4 z-50">
                    <h3 className="font-bold mb-2 text-sm">Notifications</h3>
                    <p className="text-xs text-muted-foreground">
                        You have {unseenCount} new booking{unseenCount !== 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </div>
    );
}
