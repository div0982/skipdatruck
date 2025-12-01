// Tax Audit Dashboard - Comprehensive financial and tax reporting
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import TaxAuditDashboard from '@/components/dashboard/merchant/TaxAuditDashboard';

export const dynamic = 'force-dynamic';

export default async function TaxAuditPage({ 
    searchParams 
}: { 
    searchParams: Promise<{ 
        truckId?: string;
        startDate?: string;
        endDate?: string;
        period?: 'today' | 'week' | 'month' | 'year' | 'all';
    }>
}) {
    try {
        const params = await searchParams;
        const truckId = params.truckId;

        if (!truckId) {
            return (
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-yellow-900 mb-2">Truck ID Required</h2>
                            <p className="text-yellow-800 mb-4">
                                Please provide a truckId in the URL or register a truck first.
                            </p>
                            <a
                                href="/dashboard/merchant/register"
                                className="inline-block px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-all"
                            >
                                Register Food Truck
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        // Fetch truck
        const truck = await prisma.foodTruck.findUnique({
            where: { id: truckId, isActive: true },
        });

        if (!truck) {
            return (
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-red-900 mb-2">Truck Not Found</h2>
                            <p className="text-red-800">
                                The truck with ID {truckId} was not found.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        // Calculate date range
        let startDate: Date;
        let endDate: Date = new Date();
        endDate.setHours(23, 59, 59, 999);

        const period = params.period || 'month';
        const customStart = params.startDate;
        const customEnd = params.endDate;

        if (customStart && customEnd) {
            startDate = new Date(customStart);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
        } else {
            switch (period) {
                case 'today':
                    startDate = new Date();
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - 7);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'month':
                    startDate = new Date();
                    startDate.setMonth(startDate.getMonth() - 1);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'year':
                    startDate = new Date();
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'all':
                default:
                    startDate = new Date(0); // Beginning of time
                    break;
            }
        }

        // Fetch all paid orders in date range
        const orders = await prisma.order.findMany({
            where: {
                truckId: truck.id,
                stripeStatus: 'succeeded',
                stripePaymentId: { not: null },
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate statistics
        const totalRevenue = orders.reduce((sum, order) => sum + order.subtotal, 0);
        const totalTaxCollected = orders.reduce((sum, order) => sum + order.tax, 0);
        const totalPlatformFees = orders.reduce((sum, order) => sum + order.platformFee, 0);
        const totalCollected = orders.reduce((sum, order) => sum + order.total, 0);
        const netRevenue = totalRevenue - totalPlatformFees; // Revenue after platform fees

        // Tax breakdown by period (daily for trends)
        const dailyBreakdown = orders.reduce((acc, order) => {
            const date = new Date(order.createdAt).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = {
                    date,
                    revenue: 0,
                    tax: 0,
                    orders: 0,
                };
            }
            acc[date].revenue += order.subtotal;
            acc[date].tax += order.tax;
            acc[date].orders += 1;
            return acc;
        }, {} as Record<string, { date: string; revenue: number; tax: number; orders: number }>);

        // Order status breakdown
        const statusBreakdown = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Average order value
        const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

        // Best selling items
        const itemSales = orders.reduce((acc, order) => {
            const items = order.items as Array<{ name: string; quantity: number; price: number }>;
            items.forEach(item => {
                if (!acc[item.name]) {
                    acc[item.name] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0,
                    };
                }
                acc[item.name].quantity += item.quantity;
                acc[item.name].revenue += item.price * item.quantity;
            });
            return acc;
        }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

        const bestSellingItems = Object.values(itemSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Hourly breakdown (peak hours)
        const hourlyBreakdown = orders.reduce((acc, order) => {
            const hour = new Date(order.createdAt).getHours();
            if (!acc[hour]) {
                acc[hour] = { hour, orders: 0, revenue: 0 };
            }
            acc[hour].orders += 1;
            acc[hour].revenue += order.subtotal;
            return acc;
        }, {} as Record<number, { hour: number; orders: number; revenue: number }>);

        const peakHours = Object.values(hourlyBreakdown)
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 5);

        return (
            <TaxAuditDashboard
                truck={truck}
                orders={orders}
                period={period}
                startDate={startDate.toISOString()}
                endDate={endDate.toISOString()}
                stats={{
                    totalRevenue,
                    totalTaxCollected,
                    totalPlatformFees,
                    totalCollected,
                    netRevenue,
                    totalOrders: orders.length,
                    averageOrderValue,
                    statusBreakdown,
                    dailyBreakdown: Object.values(dailyBreakdown).sort((a, b) => a.date.localeCompare(b.date)),
                    bestSellingItems,
                    peakHours,
                }}
            />
        );
    } catch (error: any) {
        console.error('Tax audit error:', error);
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Tax Audit</h2>
                        <p className="text-red-800">
                            Failed to load tax audit. Please try again later.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}

