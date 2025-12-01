// Admin Dashboard - Comprehensive platform oversight
import { prisma } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { getTaxLabel, getTaxRate } from '@/lib/tax-calculator';
import Link from 'next/link';
import AdminDashboardTabs from '@/components/admin/AdminDashboardTabs';
import { Province } from '@prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    // Get all trucks with their orders
    const allTrucks = await prisma.foodTruck.findMany({
        where: { isActive: true },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    stripeOnboarded: true,
                },
            },
            orders: {
                where: {
                    stripeStatus: 'succeeded',
                    stripePaymentId: { not: null },
                },
                select: {
                    subtotal: true,
                    tax: true,
                    platformFee: true,
                    total: true,
                },
            },
            _count: {
                select: {
                    orders: true,
                },
            },
        },
    });

    // Calculate revenue per truck
    const truckRevenue = allTrucks.map((truck) => {
        const totalOrders = truck.orders.length;
        const totalRevenue = truck.orders.reduce((sum, order) => sum + order.subtotal, 0);
        const totalTaxCollected = truck.orders.reduce((sum, order) => sum + order.tax, 0);
        const totalPlatformFees = truck.orders.reduce((sum, order) => sum + order.platformFee, 0);
        const netRevenue = totalRevenue + totalTaxCollected - totalPlatformFees;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
            truckId: truck.id,
            truckName: truck.name,
            ownerName: truck.owner.name || null,
            ownerEmail: truck.owner.email,
            province: truck.province as string,
            totalOrders,
            totalRevenue,
            totalTaxCollected,
            totalPlatformFees,
            netRevenue,
            averageOrderValue,
            isActive: truck.isActive,
            stripeOnboarded: truck.owner.stripeOnboarded,
        };
    });

    // Calculate tax audit by province
    const taxAuditMap = new Map<string, {
        province: string;
        taxLabel: string;
        totalRevenue: number;
        totalTaxCollected: number;
        orderCount: number;
        truckIds: Set<string>;
    }>();

    allTrucks.forEach((truck) => {
        const province = truck.province as Province;
        const taxLabel = getTaxLabel(province);
        
        const truckOrders = truck.orders;
        const provinceRevenue = truckOrders.reduce((sum, order) => sum + order.subtotal, 0);
        const provinceTax = truckOrders.reduce((sum, order) => sum + order.tax, 0);
        const orderCount = truckOrders.length;

        if (!taxAuditMap.has(province)) {
            taxAuditMap.set(province, {
                province,
                taxLabel,
                totalRevenue: 0,
                totalTaxCollected: 0,
                orderCount: 0,
                truckIds: new Set(),
            });
        }

        const auditData = taxAuditMap.get(province)!;
        auditData.totalRevenue += provinceRevenue;
        auditData.totalTaxCollected += provinceTax;
        auditData.orderCount += orderCount;
        auditData.truckIds.add(truck.id);
    });

    const taxAudit = Array.from(taxAuditMap.values()).map((data) => ({
        province: data.province,
        taxLabel: data.taxLabel,
        totalRevenue: data.totalRevenue,
        totalTaxCollected: data.totalTaxCollected,
        orderCount: data.orderCount,
        truckCount: data.truckIds.size,
    }));

    // Get total stats
    const allOrders = await prisma.order.findMany({
        where: {
            stripeStatus: 'succeeded',
            stripePaymentId: { not: null },
        },
        select: {
            subtotal: true,
            tax: true,
            platformFee: true,
            total: true,
        },
    });

    const totalTrucks = allTrucks.length;
    const totalOrders = allOrders.length;
    const totalPlatformRevenue = allOrders.reduce((sum, order) => sum + order.platformFee, 0);
    const totalVolume = allOrders.reduce((sum, order) => sum + order.total, 0);
    const totalTaxCollected = allOrders.reduce((sum, order) => sum + order.tax, 0);

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
        where: {
            stripeStatus: 'succeeded',
            stripePaymentId: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        include: {
            truck: {
                select: {
                    name: true,
                },
            },
        },
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-sm text-gray-600">Platform Overview & Analytics</p>
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

            <div className="max-w-7xl mx-auto px-4 py-6">
                <AdminDashboardTabs
                    trucks={truckRevenue}
                    taxAudit={taxAudit}
                    totalStats={{
                        totalTrucks,
                        totalOrders,
                        totalPlatformRevenue,
                        totalVolume,
                        totalTaxCollected,
                    }}
                    recentOrders={recentOrders}
                    recentTrucks={recentTrucks}
                />
            </div>
        </div>
    );
}
