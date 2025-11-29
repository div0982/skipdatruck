'use client';

// Dashboard Stats Component
import { DollarSign, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardStatsProps {
    todayOrders: number;
    todayRevenue: number;
    totalMenuItems: number;
}

export default function DashboardStats({
    todayOrders,
    todayRevenue,
    totalMenuItems,
}: DashboardStatsProps) {
    const stats = [
        {
            label: "Today's Orders",
            value: todayOrders,
            icon: ShoppingBag,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            label: "Today's Revenue",
            value: formatCurrency(todayRevenue),
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            label: 'Menu Items',
            value: totalMenuItems,
            icon: UtensilsCrossed,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.label}
                        className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                                <Icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
