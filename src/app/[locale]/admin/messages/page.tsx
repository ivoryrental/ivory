"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Mail, MessageSquareText, Phone } from "lucide-react";

interface LeadMessage {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string | null;
    status: string;
    date: string;
    dateISO: string;
}

export default function AdminMessagesPage() {
    const t = useTranslations("adminMessages");
    const [messages, setMessages] = useState<LeadMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/leads")
            .then((res) => res.json())
            .then((data) => {
                setMessages(Array.isArray(data) ? data : []);
            })
            .catch(() => setMessages([]))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-serif text-foreground">{t("title")}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
            </div>

            {isLoading ? (
                <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
                    {t("loading")}
                </div>
            ) : messages.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
                    <MessageSquareText size={40} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">{t("empty")}</p>
                    <p className="mt-2 text-sm">{t("emptyDescription")}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map((message) => (
                        <article key={message.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">{message.name}</h2>
                                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <span className="inline-flex items-center gap-2">
                                                <Mail size={16} />
                                                {message.email}
                                            </span>
                                            {message.phone ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <Phone size={16} />
                                                    {message.phone}
                                                </span>
                                            ) : null}
                                            <span className="inline-flex items-center gap-2">
                                                <CalendarDays size={16} />
                                                {message.date}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-muted/40 p-4 text-sm leading-6 text-foreground whitespace-pre-wrap">
                                        {message.message || t("noMessage")}
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                                        {t("newBadge")}
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
