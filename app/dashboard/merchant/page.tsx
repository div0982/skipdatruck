// Merchant Dashboard - Session-based (no truck ID in URL)
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import LiveOrders from '@/components/dashboard/merchant/LiveOrders';
import DashboardStats from '@/components/dashboard/merchant/DashboardStats';
import StripeConnectButton from '@/components/stripe/StripeConnectButton';
import StripeDashboardButton from '@/components/stripe/StripeDashboardButton';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function MerchantDashboard() {
    try {
        // Get session
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            redirect('/login');
        }

        // Fetch user's trucks
        const trucks = await prisma.foodTruck.findMany({
            where: {
                ownerId: session.user.id,
                isActive: true,
            },
            include: {
                owner: true,
                _count: {
                    select: {
                        orders: true,
                        menuItems: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // If no trucks, redirect to registration
        if (!trucks || trucks.length === 0) {
            return (
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Welcome to Merchant Dashboard
                                </h1>
                                <p className="text-gray-600">
                                    Register your food truck to get started
                                </p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                                <p className="text-yellow-800 text-center">
                                    No truck registered yet. Click the button below to register a new food truck.
                                </p>
                            </div>

                            <a
                                href="/dashboard/merchant/register"
                                className="block w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-center"
                            >
                                Register New Food Truck
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        // Use first truck
        const truck = trucks[0];

        // Get today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = await prisma.order.findMany({
            where: {
                truckId: truck.id,
                createdAt: {
                    gte: today,
                },
            },
        });

        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.subtotal, 0);

        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b">
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <h1 className="text-2xl font-bold text-gray-900">{truck.name}</h1>
                        <p className="text-sm text-gray-600">Merchant Dashboard</p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                    {/* Stats */}
                    <DashboardStats
                        todayOrders={todayOrders.length}
                        todayRevenue={todayRevenue}
                        totalMenuItems={truck._count.menuItems}
                    />

                    {/* Stripe Connect Banner - Show if not onboarded */}
                    {!truck.owner.stripeOnboarded && (
                        <StripeConnectButton
                            truckId={truck.id}
                            truckName={truck.name}
                        />
                    )}

                    {/* Live Orders */}
                    <LiveOrders truckId={truck.id} />

                    {/* Quick Links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a
                            href="/dashboard/merchant/menu"
                            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
                        >
                            <h3 className="font-semibold text-gray-900 mb-2">Add Menu Items</h3>
                            <p className="text-sm text-gray-600">Upload image or paste text - AI extracts everything</p>
                        </a>

                        <a
                            href="/dashboard/merchant/menu-edit"
                            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
                        >
                            <h3 className="font-semibold text-gray-900 mb-2">✏️ Edit Menu</h3>
                            <p className="text-sm text-gray-600">Update prices, descriptions, and manage items</p>
                        </a>

                        <a
                            href={`/t/${truck.id}`}
                            target="_blank"
                            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
                        >
                            <h3 className="font-semibold text-gray-900 mb-2">👀 View Menu (Customer)</h3>
                            <p className="text-sm text-gray-600">See how customers see your menu</p>
                        </a>

                        <a
                            href={`/dashboard/merchant/tax-audit?truckId=${truck.id}`}
                            className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200 hover:border-purple-300 hover:shadow-md transition-all"
                        >
                            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                📊 Tax Audit & Reports
                            </h3>
                            <p className="text-sm text-gray-600">Financial reports, tax owed, revenue analytics</p>
                        </a>

                        <a
                            href={`/dashboard/merchant/qr?truckId=${truck.id}`}
                            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
                        >
                            <h3 className="font-semibold text-gray-900 mb-2">QR Code</h3>
                            <p className="text-sm text-gray-600">Download your QR code</p>
                        </a>

                        {truck.owner.stripeOnboarded && (
                            <StripeDashboardButton userId={truck.owner.id} />
                        )}
                    </div>
                </div>
            </div>
        );
    } catch (error: any) {
        console.error('Merchant dashboard error:', error);
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Dashboard</h2>
                        <p className="text-red-800">
                            Failed to load dashboard. Please try again later.
                        </p>
                        <p className="text-sm text-red-700 mt-2">
                            Error: {error.message || 'Unknown error'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}
