// Admin Dashboard  - Overview for platform admins
import { prisma } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';
import Link from 'next/link';
import DeleteMerchantButton from '@/components/admin/DeleteMerchantButton';

// Force dynamic rendering - don't try to build this at build time
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    // Get stats
    const totalTrucks = await prisma.foodTruck.count({ where: { isActive: true } });
    const totalOrders = await prisma.order.count();

    const allOrders = await prisma.order.findMany({
        select: {
            platformFee: true,
            total: true,
        },
    });

    const totalPlatformRevenue = allOrders.reduce((sum, order) => sum + order.platformFee, 0);
    const totalVolume = allOrders.reduce((sum, order) => sum + order.total, 0);

    // Get recent trucks
    const recentTrucks = await prisma.foodTruck.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    stripeOnboarded: true,
                },
            },
            _count: {
                select: {
                    orders: true,
                },
            },
        },
    });

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
            truck: {
                select: {
                    name: true,
                },
            },
        },
    });

    const stats = [
        {
            label: 'Total Trucks',
            value: totalTrucks,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            label: 'Total Orders',
            value: totalOrders,
            icon: ShoppingBag,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            label: 'Platform Revenue',
            value: formatCurrency(totalPlatformRevenue),
            icon: DollarSign,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            label: 'Total Volume',
            value: formatCurrency(totalVolume),
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-sm text-gray-600">Platform Overview</p>
                        </div>
                        <Link
                            href="/"
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                {/* Recent Trucks & Orders */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Recent Trucks */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h2 className="text-lg font-bold mb-4">Recent Trucks</h2>
                        <div className="space-y-3">
                            {recentTrucks.map((truck) => (
                                <div key={truck.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{truck.name}</h3>
                                        <p className="text-sm text-gray-600">{truck.owner.email}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${truck.owner.stripeOnboarded
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {truck.owner.stripeOnboarded ? 'Active' : 'Pending'}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{truck._count.orders} orders</p>
                                        </div>
                                        <DeleteMerchantButton
                                            userId={truck.owner.id}
                                            userName={truck.owner.name || ''}
                                            userEmail={truck.owner.email}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h2 className="text-lg font-bold mb-4">Recent Orders</h2>
                        <div className="space-y-3">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
                                        <p className="text-sm text-gray-600">{order.truck.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                                        <p className="text-xs text-gray-500">{order.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
