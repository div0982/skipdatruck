'use client';

// Tax Audit Dashboard Component
import { useState } from 'react';
import { 
    DollarSign, 
    Receipt, 
    TrendingUp, 
    FileText, 
    Download, 
    Calendar,
    AlertCircle,
    CheckCircle,
    Clock,
    ChefHat,
    BarChart3,
    PieChart,
    ArrowLeft
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getTaxLabel } from '@/lib/tax-calculator';
import { useRouter } from 'next/navigation';

interface TaxAuditDashboardProps {
    truck: {
        id: string;
        name: string;
        province: any;
        taxRate: number;
    };
    orders: any[];
    period: string;
    startDate: string;
    endDate: string;
    stats: {
        totalRevenue: number;
        totalTaxCollected: number;
        totalPlatformFees: number;
        totalCollected: number;
        netRevenue: number;
        totalOrders: number;
        averageOrderValue: number;
        statusBreakdown: Record<string, number>;
        dailyBreakdown: Array<{ date: string; revenue: number; tax: number; orders: number }>;
        bestSellingItems: Array<{ name: string; quantity: number; revenue: number }>;
        peakHours: Array<{ hour: number; orders: number; revenue: number }>;
    };
}

export default function TaxAuditDashboard({ 
    truck, 
    orders, 
    period, 
    startDate, 
    endDate, 
    stats 
}: TaxAuditDashboardProps) {
    const router = useRouter();
    const [selectedPeriod, setSelectedPeriod] = useState(period);

    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod);
        router.push(`/dashboard/merchant/tax-audit?truckId=${truck.id}&period=${newPeriod}`);
    };

    const handleExportCSV = () => {
        const csv = [
            ['Date', 'Order Number', 'Subtotal', 'Tax', 'Platform Fee', 'Total', 'Status'].join(','),
            ...orders.map(order => [
                new Date(order.createdAt).toLocaleDateString('en-CA'),
                order.orderNumber,
                order.subtotal.toFixed(2),
                order.tax.toFixed(2),
                order.platformFee.toFixed(2),
                order.total.toFixed(2),
                order.status,
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-audit-${truck.name}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const taxLabel = getTaxLabel(truck.province);
    const taxRate = (truck.taxRate * 100).toFixed(1);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <a
                                    href="/dashboard/merchant"
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </a>
                                <h1 className="text-2xl font-bold text-gray-900">Tax Audit & Financial Report</h1>
                            </div>
                            <p className="text-sm text-gray-600">{truck.name}</p>
                        </div>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Period Selector */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <h2 className="font-semibold text-gray-900">Time Period</h2>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {['today', 'week', 'month', 'year', 'all'].map((p) => (
                            <button
                                key={p}
                                onClick={() => handlePeriodChange(p)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    selectedPeriod === p
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        {new Date(startDate).toLocaleDateString('en-CA')} - {new Date(endDate).toLocaleDateString('en-CA')}
                    </p>
                </div>

                {/* Key Financial Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Total Revenue</span>
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                        <p className="text-xs text-gray-500 mt-1">Before tax & fees</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Tax Collected ({taxLabel})</span>
                            <Receipt className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalTaxCollected)}</p>
                        <p className="text-xs text-red-600 mt-1 font-semibold">Owed to Government</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Platform Fees</span>
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalPlatformFees)}</p>
                        <p className="text-xs text-gray-500 mt-1">Paid to platform</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Net Revenue</span>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.netRevenue)}</p>
                        <p className="text-xs text-gray-500 mt-1">After platform fees</p>
                    </div>
                </div>

                {/* Tax Owed Alert */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-bold text-yellow-900 mb-2">Tax Remittance Required</h3>
                            <p className="text-yellow-800 mb-3">
                                You have collected <strong>{formatCurrency(stats.totalTaxCollected)}</strong> in {taxLabel} ({taxRate}%) 
                                during this period. This amount must be remitted to the Canada Revenue Agency (CRA).
                            </p>
                            <div className="bg-white rounded-lg p-4 border border-yellow-200">
                                <p className="text-sm font-semibold text-gray-900 mb-2">Tax Breakdown:</p>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax Collected:</span>
                                        <span className="font-semibold text-yellow-900">{formatCurrency(stats.totalTaxCollected)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax Rate:</span>
                                        <span className="font-semibold">{taxRate}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Taxable Revenue:</span>
                                        <span className="font-semibold">{formatCurrency(stats.totalRevenue)}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-yellow-700 mt-3">
                                💡 Keep this report for your tax records. File your GST/HST return with CRA.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Summary */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                            <h2 className="font-bold text-gray-900">Order Statistics</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b">
                                <span className="text-gray-600">Total Orders</span>
                                <span className="text-xl font-bold text-gray-900">{stats.totalOrders}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b">
                                <span className="text-gray-600">Average Order Value</span>
                                <span className="text-xl font-bold text-purple-600">{formatCurrency(stats.averageOrderValue)}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b">
                                <span className="text-gray-600">Total Collected</span>
                                <span className="text-xl font-bold text-green-600">{formatCurrency(stats.totalCollected)}</span>
                            </div>
                            <div className="pt-2">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Order Status Breakdown:</p>
                                <div className="space-y-2">
                                    {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                                        <div key={status} className="flex justify-between text-sm">
                                            <span className="text-gray-600 capitalize">{status.toLowerCase()}</span>
                                            <span className="font-semibold">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Trend */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <h2 className="font-bold text-gray-900">Daily Revenue Trend</h2>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {stats.dailyBreakdown.length > 0 ? (
                                stats.dailyBreakdown.map((day) => (
                                    <div key={day.date} className="flex items-center justify-between pb-2 border-b">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {new Date(day.date).toLocaleDateString('en-CA', { 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                            <p className="text-xs text-gray-500">{day.orders} orders</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">{formatCurrency(day.revenue)}</p>
                                            <p className="text-xs text-blue-600">Tax: {formatCurrency(day.tax)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-8">No data for this period</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Best Selling Items */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-5 h-5 text-orange-600" />
                        <h2 className="font-bold text-gray-900">Top Selling Items</h2>
                    </div>
                    {stats.bestSellingItems.length > 0 ? (
                        <div className="space-y-3">
                            {stats.bestSellingItems.map((item, index) => (
                                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.quantity} sold</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{formatCurrency(item.revenue)}</p>
                                        <p className="text-xs text-gray-500">
                                            {formatCurrency(item.revenue / item.quantity)} avg
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No sales data available</p>
                    )}
                </div>

                {/* Peak Hours */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-bold text-gray-900">Peak Order Hours</h2>
                    </div>
                    {stats.peakHours.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {stats.peakHours.map((hour) => {
                                const hourLabel = hour.hour === 0 ? '12 AM' : 
                                                 hour.hour < 12 ? `${hour.hour} AM` : 
                                                 hour.hour === 12 ? '12 PM' : 
                                                 `${hour.hour - 12} PM`;
                                return (
                                    <div key={hour.hour} className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                        <p className="text-lg font-bold text-indigo-600">{hourLabel}</p>
                                        <p className="text-sm text-gray-600 mt-1">{hour.orders} orders</p>
                                        <p className="text-xs text-gray-500 mt-1">{formatCurrency(hour.revenue)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No peak hour data available</p>
                    )}
                </div>

                {/* Detailed Order List */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <h2 className="font-bold text-gray-900">Order Details ({orders.length} orders)</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Order #</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Subtotal</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Tax</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Platform Fee</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-600">
                                                {new Date(order.createdAt).toLocaleDateString('en-CA')}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-purple-600">{order.orderNumber}</span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium">{formatCurrency(order.subtotal)}</td>
                                            <td className="py-3 px-4 text-right text-blue-600">{formatCurrency(order.tax)}</td>
                                            <td className="py-3 px-4 text-right text-purple-600">{formatCurrency(order.platformFee)}</td>
                                            <td className="py-3 px-4 text-right font-bold">{formatCurrency(order.total)}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'PREPARING' ? 'bg-orange-100 text-orange-700' :
                                                    order.status === 'READY' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-gray-500">
                                            No orders found for this period
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Footer */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="font-bold text-gray-900 mb-4">Financial Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">Gross Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">Tax Owed to CRA</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalTaxCollected)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">Platform Fees Paid</p>
                            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalPlatformFees)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">Net Revenue (Your Take)</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.netRevenue)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

