"use client";

import { Package, Users, DollarSign, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardStats } from "@/lib/types";
import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter, usePathname } from "next/navigation";

interface PopularItem {
    name: string;
    count: number;
}

export default function AdminDashboard() {
    const t = useTranslations('dashboard_stats');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        fetch('/api/stats')
            .then(res => {
                if (res.status === 401 || res.status === 403) {
                    // Extract locale from pathname (e.g., /en/admin -> en)
                    const locale = pathname.split('/')[1] || 'ka';
                    router.push(`/${locale}/admin/login`);
                    throw new Error("Unauthorized");
                }
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                if (err.message !== "Unauthorized") {
                    setError("Failed to load dashboard statistics.");
                    setLoading(false);
                }
            });
    }, [router, pathname]);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const dashboardItems = [
        { label: t('totalProducts'), value: stats?.totalProducts || 0, icon: Package },
        { label: t('activeRentals'), value: stats?.activeRentals || 0, icon: TrendingUp },
        { label: t('totalCustomers'), value: stats?.totalCustomers || 0, icon: Users },
        { label: t('monthlyRevenue'), value: `₾${stats?.monthlyRevenue || 0}`, icon: DollarSign },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-serif mb-8 text-foreground">{t('title')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardItems.map((stat, i) => (
                    <div key={i} className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Chart */}
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm min-h-[300px]">
                    <h3 className="text-lg font-bold mb-4 font-serif text-foreground">{t('activityChart')}</h3>
                    <div className="h-[250px] w-full min-w-0">
                        {stats?.chartData && stats.chartData.length > 0 ? (
                            <ResponsiveContainer
                                width="100%"
                                height={250}
                                minWidth={280}
                                minHeight={250}
                            >
                                <BarChart data={stats.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(val) => val.slice(5)} // Show MM-DD
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="count" fill="#D4A58E" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg">
                                <TrendingUp className="mb-2 opacity-20" size={32} />
                                <span className="text-sm">No activity recorded yet</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Popular Items */}
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm min-h-[300px]">
                    <h3 className="text-lg font-bold mb-4 font-serif text-foreground">{t('popularItems')}</h3>
                    {stats?.popularItems && stats.popularItems.length > 0 ? (
                        <div className="space-y-3">
                            {stats.popularItems.map((item: PopularItem, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded-full text-xs font-bold">
                                            {idx + 1}
                                        </span>
                                        <span className="font-medium text-sm">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-muted-foreground">{item.count} orders</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg">
                            <Package className="mb-2 opacity-20" size={32} />
                            <span className="text-sm">No data available</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
