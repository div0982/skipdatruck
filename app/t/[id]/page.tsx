// QR Landing Page - Customer scans QR and arrives here
// Shows truck menu and allows ordering

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import MenuBrowser from '@/components/menu/MenuBrowser';
import TruckHeader from '@/components/truck/TruckHeader';
import CartProvider from '@/components/cart/CartProvider';
import CartDrawer from '@/components/cart/CartDrawer';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function TruckPage({ params }: { params: Promise<{ id: string }> }) {
    try {
        // In Next.js 16, params is a Promise and must be awaited
        const { id } = await params;

        const truck = await prisma.foodTruck.findUnique({
            where: { id, isActive: true },
            include: {
                menuItems: {
                    where: { isAvailable: true },
                    orderBy: { sortOrder: 'asc' },
                },
                owner: {
                    select: {
                        businessModel: true,
                    }
                }
            },
        });

        if (!truck) {
            notFound();
        }

        // Check shop status
        const shopStatus = truck.shopStatus || 'OPEN';
        const isShopAvailable = shopStatus === 'OPEN';

        // Group items by category
        const categories = [...new Set(truck.menuItems.map(item => item.category))];

        return (
            <CartProvider truck={truck}>
                <div className="min-h-screen bg-white pb-24">
                    {/* Shop Status Banner */}
                    {shopStatus === 'PAUSED' && (
                        <div className="bg-yellow-500 text-white px-4 py-3 text-center">
                            <p className="font-semibold">⏸️ This shop is temporarily paused</p>
                            <p className="text-sm opacity-90">They're catching up on orders. Please check back soon!</p>
                        </div>
                    )}
                    {shopStatus === 'CLOSED' && (
                        <div className="bg-red-500 text-white px-4 py-3 text-center">
                            <p className="font-semibold">🔴 This shop is currently closed</p>
                            <p className="text-sm opacity-90">Please come back later when they're open.</p>
                        </div>
                    )}

                    <TruckHeader truck={truck} />
                    <MenuBrowser
                        menuItems={truck.menuItems}
                        categories={categories}
                        truckId={truck.id}
                    />
                    {isShopAvailable && (
                        <CartDrawer truck={truck} businessModel={truck.owner.businessModel || 'MERCHANT_PAYS_FEES'} />
                    )}
                </div>
            </CartProvider>
        );
    } catch (error) {
        console.error('Error loading truck:', error);
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Menu</h2>
                    <p className="text-red-800">
                        Unable to load the menu. Please try again later.
                    </p>
                </div>
            </div>
        );
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const truck = await prisma.foodTruck.findUnique({
        where: { id },
    });

    if (!truck) {
        return {
            title: 'Food Truck Not Found',
        };
    }

    return {
        title: `${truck.name} - Order Now`,
        description: truck.description || `Order from ${truck.name}`,
    };
}
