'use client';

import { useState } from 'react';
import {
    BarChart3,
    DollarSign,
    FileText,
    TrendingUp,
    Download,
    Calendar,
    Truck,
    Receipt,
    PieChart,
    Settings
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getTaxLabel } from '@/lib/tax-calculator';
import TruckManagement from './TruckManagement';

interface TruckRevenue {
    truckId: string;
    truckName: string;
    ownerName: string | null;
    ownerEmail: string;
    province: string;
    totalOrders: number;
    totalRevenue: number;
    totalTaxCollected: number;
    totalPlatformFees: number;
    netRevenue: number;
    averageOrderValue: number;
    isActive: boolean;
    stripeOnboarded: boolean;
}

interface TaxAuditData {
    monthly: Array<{
        month: string;
        year: number;
        platformFees: number;
        orderCount: number;
        truckCount: number;
    }>;
    quarterly: Array<{
        quarter: string;
        year: number;
        platformFees: number;
        orderCount: number;
    }>;
}

interface AdminDashboardTabsProps {
    trucks: TruckRevenue[];
    taxAudit: TaxAuditData;
    totalStats: {
        totalTrucks: number;
        totalOrders: number;
        totalPlatformRevenue: number;
        totalStripeFees: number;
        netPlatformRevenue: number;
        totalVolume: number;
        totalTaxCollected: number;
    };
    recentOrders: any[];
    recentTrucks: any[];
}

export default function AdminDashboardTabs({
    trucks,
    taxAudit,
    totalStats,
    recentOrders,
    recentTrucks
}: AdminDashboardTabsProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'tax' | 'analytics' | 'management'>('overview');

    const handleExportRevenue = () => {
        const csv = [
            ['Truck Name', 'Owner', 'Province', 'Total Orders', 'Total Revenue', 'Tax Collected', 'Platform Fees', 'Net Revenue', 'Avg Order Value'].join(','),
            ...trucks.map(truck => [
                truck.truckName,
                truck.ownerName || truck.ownerEmail || 'N/A',
                truck.province,
                truck.totalOrders,
                truck.totalRevenue.toFixed(2),
                truck.totalTaxCollected.toFixed(2),
                truck.totalPlatformFees.toFixed(2),
                truck.netRevenue.toFixed(2),
                truck.averageOrderValue.toFixed(2),
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `truck-revenue-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleExportTax = (type: 'monthly' | 'quarterly') => {
        if (type === 'monthly') {
            const csv = [
                ['Month', 'Year', 'Platform Fees (Income)', 'Orders'].join(','),
                ...taxAudit.monthly.map(item => [
                    item.month,
                    item.year,
                    item.platformFees.toFixed(2),
                    item.orderCount,
                ].join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `platform-revenue-monthly-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            const csv = [
                ['Quarter', 'Year', 'Platform Fees (Income)', 'Orders'].join(','),
                ...taxAudit.quarterly.map(item => [
                    item.quarter,
                    item.year,
                    item.platformFees.toFixed(2),
                    item.orderCount,
                ].join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `platform-revenue-quarterly-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 p-1">
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'overview'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            <span>Overview</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'revenue'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>Revenue by Truck</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('tax')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'tax'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>Tax Audit</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'analytics'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>Analytics</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('management')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'management'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Settings className="w-4 h-4" />
                            <span>Management</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <OverviewTab
                        totalStats={totalStats}
                        recentOrders={recentOrders}
                        recentTrucks={recentTrucks}
                    />
                )}

                {activeTab === 'revenue' && (
                    <RevenueTab
                        trucks={trucks}
                        onExport={handleExportRevenue}
                    />
                )}

                {activeTab === 'tax' && (
                    <TaxAuditTab
                        taxAudit={taxAudit}
                        onExport={(type) => handleExportTax(type)}
                    />
                )}

                {activeTab === 'analytics' && (
                    <AnalyticsTab
                        trucks={trucks}
                        totalStats={totalStats}
                    />
                )}

                {activeTab === 'management' && (
                    <TruckManagement trucks={trucks} />
                )}
            </div>
        </div>
    );
}

function OverviewTab({ totalStats, recentOrders, recentTrucks }: any) {
    return (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Total Trucks</p>
                            <p className="text-2xl font-bold text-gray-900">{totalStats.totalTrucks}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                            <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{totalStats.totalOrders}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                            <Receipt className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Platform Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalStats.totalPlatformRevenue)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Total Tax Collected</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalStats.totalTaxCollected)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Stripe Fees Paid</p>
                            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalStats.totalStripeFees)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                            <Receipt className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Net Platform Revenue</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.netPlatformRevenue)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h2 className="text-lg font-bold mb-4">Recent Trucks</h2>
                    <div className="space-y-3">
                        {recentTrucks.map((truck: any) => (
                            <div key={truck.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{truck.name}</h3>
                                    <p className="text-sm text-gray-600">{truck.owner.email}</p>
                                </div>
                                <div className="text-right">
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${truck.owner.stripeOnboarded
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {truck.owner.stripeOnboarded ? 'Active' : 'Pending'}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{truck._count.orders} orders</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h2 className="text-lg font-bold mb-4">Recent Orders</h2>
                    <div className="space-y-3">
                        {recentOrders.map((order: any) => (
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
        </>
    );
}

function RevenueTab({ trucks, onExport }: { trucks: TruckRevenue[]; onExport: () => void }) {
    const sortedTrucks = [...trucks].sort((a, b) => b.totalRevenue - a.totalRevenue);

    return (
        <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Revenue by Truck</h2>
                    <p className="text-sm text-gray-600 mt-1">Total revenue generated by each food truck</p>
                </div>
                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Truck
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Owner
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Province
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Orders
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Revenue
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tax Collected
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Platform Fees
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Net Revenue
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Avg Order
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedTrucks.length > 0 ? (
                            sortedTrucks.map((truck) => (
                                <tr key={truck.truckId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-semibold text-gray-900">{truck.truckName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{truck.ownerName || truck.ownerEmail || 'N/A'}</div>
                                        {truck.ownerName && (
                                            <div className="text-xs text-gray-500">{truck.ownerEmail}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {truck.province}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                        {truck.totalOrders}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                        {formatCurrency(truck.totalRevenue)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                                        {formatCurrency(truck.totalTaxCollected)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-purple-600">
                                        {formatCurrency(truck.totalPlatformFees)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-blue-600">
                                        {formatCurrency(truck.netRevenue)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                                        {formatCurrency(truck.averageOrderValue)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${truck.isActive ? 'bg-green-500' : 'bg-gray-400'
                                                }`} />
                                            <span className={`text-xs font-medium ${truck.stripeOnboarded
                                                ? 'text-green-700'
                                                : 'text-yellow-700'
                                                }`}>
                                                {truck.stripeOnboarded ? 'Active' : 'Pending'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-500">
                                    No trucks found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TaxAuditTab({ taxAudit, onExport }: { taxAudit: TaxAuditData; onExport: (type: 'monthly' | 'quarterly') => void }) {
    const totalPlatformFees = taxAudit.monthly.reduce((sum, data) => sum + data.platformFees, 0);
    const currentYear = new Date().getFullYear();
    const currentYearRevenue = taxAudit.monthly
        .filter(data => data.year === currentYear)
        .reduce((sum, data) => sum + data.platformFees, 0);
    const totalOrders = taxAudit.monthly.reduce((sum, data) => sum + data.orderCount, 0);

    return (
        <div className="space-y-6">
            {/* Summary Cards - Platform Revenue for Tax Filing */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Total Platform Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalPlatformFees)}</p>
                    <p className="text-xs text-gray-500 mt-1">All time income</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">{currentYear} Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(currentYearRevenue)}</p>
                    <p className="text-xs text-gray-500 mt-1">For tax filing</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Orders processed</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Avg per Transaction</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {totalOrders > 0 ? formatCurrency(totalPlatformFees / totalOrders) : '$0.00'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Platform fee average</p>
                </div>
            </div>

            {/* Tax Filing Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-lg font-bold text-blue-900 mb-2">Tax Filing Information</h3>
                        <p className="text-sm text-blue-800 mb-3">
                            This page shows your <strong>platform revenue (fees collected)</strong> which is your business income for tax purposes.
                            Use the monthly or quarterly breakdowns below to report your income when filing taxes.
                        </p>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>Platform fees = Your business income (report on Schedule C or T2125)</li>
                            <li>Export monthly/quarterly data for your accountant</li>
                            <li>Keep records of all transactions for CRA audits</li>
                            <li>Consider business expenses (hosting, Stripe fees, etc.) separately</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Monthly Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Monthly Revenue Breakdown</h2>
                        <p className="text-sm text-gray-600 mt-1">Platform fees collected by month (for tax filing)</p>
                    </div>
                    <button
                        onClick={() => onExport('monthly')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export Monthly CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Month
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Platform Fees (Income)
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transactions
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avg per Transaction
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {taxAudit.monthly.length > 0 ? (
                                taxAudit.monthly.map((data) => (
                                    <tr key={data.month} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                                            {data.month}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-600">
                                            {formatCurrency(data.platformFees)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                                            {data.orderCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                                            {data.orderCount > 0
                                                ? formatCurrency(data.platformFees / data.orderCount)
                                                : '$0.00'
                                            }
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                                        No revenue data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quarterly Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Quarterly Revenue Breakdown</h2>
                        <p className="text-sm text-gray-600 mt-1">Platform fees by quarter (useful for GST/HST returns)</p>
                    </div>
                    <button
                        onClick={() => onExport('quarterly')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export Quarterly CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quarter
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Platform Fees (Income)
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transactions
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avg per Transaction
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {taxAudit.quarterly.length > 0 ? (
                                taxAudit.quarterly.map((data) => (
                                    <tr key={data.quarter} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                                            {data.quarter}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-600">
                                            {formatCurrency(data.platformFees)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                                            {data.orderCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                                            {data.orderCount > 0
                                                ? formatCurrency(data.platformFees / data.orderCount)
                                                : '$0.00'
                                            }
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                                        No revenue data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function AnalyticsTab({ trucks, totalStats }: any) {
    const topTrucks = [...trucks].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
    const avgOrderValue = totalStats.totalOrders > 0
        ? totalStats.totalVolume / totalStats.totalOrders
        : 0;
    const avgPlatformFee = totalStats.totalOrders > 0
        ? totalStats.totalPlatformRevenue / totalStats.totalOrders
        : 0;

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Average Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(avgOrderValue)}</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Avg Platform Fee per Order</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(avgPlatformFee)}</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Platform Fee Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {totalStats.totalVolume > 0
                            ? ((totalStats.totalPlatformRevenue / totalStats.totalVolume) * 100).toFixed(2)
                            : '0.00'
                        }%
                    </p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Active Trucks</p>
                    <p className="text-2xl font-bold text-green-600">
                        {trucks.filter((t: any) => t.isActive && t.stripeOnboarded).length}
                    </p>
                </div>
            </div>

            {/* Top Performing Trucks */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold mb-4">Top 5 Performing Trucks</h2>
                <div className="space-y-4">
                    {topTrucks.map((truck: any, index: number) => (
                        <div key={truck.truckId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{truck.truckName}</h3>
                                    <p className="text-sm text-gray-600">{truck.province} • {truck.totalOrders} orders</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">{formatCurrency(truck.totalRevenue)}</p>
                                <p className="text-xs text-gray-500">Platform: {formatCurrency(truck.totalPlatformFees)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

