// Merchant Dashboard - Main page for truck owners
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import LiveOrders from '@/components/dashboard/merchant/LiveOrders';
import DashboardStats from '@/components/dashboard/merchant/DashboardStats';

// This is a simplified version - in production, you'd have proper auth
export default async function MerchantDashboard({ 
    searchParams 
}: { 
    searchParams: Promise<{ truckId?: string }>
}) {
    // In Next.js 16, searchParams is a Promise and must be awaited
    const params = await searchParams;
    const truckId = params.truckId;

    // Debug logging
    console.log('[Merchant Dashboard] Raw searchParams:', params);
    console.log('[Merchant Dashboard] truckId extracted:', truckId);

    if (!truckId) {
        // Show registration prompt with button
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
                            <p className="text-sm text-yellow-700 mt-2 text-center">
                                Your truck ID will be saved in your browser for easy access.
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

    let truck;
    try {
        truck = await prisma.foodTruck.findUnique({
            where: { id: truckId },
            include: {
                owner: true,
                _count: {
                    select: {
                        orders: true,
                        menuItems: true,
                    },
                },
            },
        });
        console.log('Merchant Dashboard - Truck found:', truck ? truck.name : 'null');
    } catch (error) {
        console.error('Merchant Dashboard - Database error:', error);
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-red-900 mb-2">Database Error</h2>
                        <p className="text-red-800">Failed to fetch truck from database. Please check your database connection.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!truck) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                            <h2 className="text-xl font-bold text-red-900 mb-2">Truck Not Found</h2>
                            <p className="text-red-800 mb-4">
                                The truck with ID <code className="bg-red-100 px-2 py-1 rounded">{truckId}</code> was not found in the database.
                            </p>
                            <p className="text-sm text-red-700 mb-4">
                                This might happen if:
                            </p>
                            <ul className="list-disc list-inside text-sm text-red-700 mb-4 space-y-1">
                                <li>The truck was deleted</li>
                                <li>The truck ID is incorrect</li>
                                <li>The database was reset</li>
                            </ul>
                            <a
                                href="/dashboard/merchant/register"
                                className="inline-block px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all"
                            >
                                Register a New Food Truck
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                {/* Register New Truck Button */}
                <div className="flex justify-end">
                    <a
                        href="/dashboard/merchant/register"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Register New Truck
                    </a>
                </div>

                {/* Stats */}
                <DashboardStats
                    todayOrders={todayOrders.length}
                    todayRevenue={todayRevenue}
                    totalMenuItems={truck._count.menuItems}
                />

                {/* Live Orders */}
                <LiveOrders truckId={truck.id} />

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href={`/dashboard/merchant/menu?truckId=${truck.id}`}
                        className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
                    >
                        <h3 className="font-semibold text-gray-900 mb-2">Add Menu Items</h3>
                        <p className="text-sm text-gray-600">Upload image or paste text - AI extracts everything</p>
                    </a>

                    <a
                        href={`/t/${truck.id}`}
                        target="_blank"
                        className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
                    >
                        <h3 className="font-semibold text-gray-900 mb-2">View Menu</h3>
                        <p className="text-sm text-gray-600">See how customers see your menu</p>
                    </a>

                    <a
                        href={`/dashboard/merchant/qr?truckId=${truck.id}`}
                        className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
                    >
                        <h3 className="font-semibold text-gray-900 mb-2">QR Code</h3>
                        <p className="text-sm text-gray-600">Download your QR code</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
