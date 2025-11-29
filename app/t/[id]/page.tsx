// QR Landing Page - Customer scans QR and arrives here
// Shows truck menu and allows ordering

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import MenuBrowser from '@/components/menu/MenuBrowser';
import TruckHeader from '@/components/truck/TruckHeader';
import CartProvider from '@/components/cart/CartProvider';
import CartDrawer from '@/components/cart/CartDrawer';

export default async function TruckPage({ params }: { params: Promise<{ id: string }> }) {
    // In Next.js 16, params is a Promise and must be awaited
    const { id } = await params;
    
    const truck = await prisma.foodTruck.findUnique({
        where: { id, isActive: true },
        include: {
            menuItems: {
                where: { isAvailable: true },
                orderBy: { sortOrder: 'asc' },
            },
        },
    });

    if (!truck) {
        notFound();
    }

    // Group items by category
    const categories = [...new Set(truck.menuItems.map(item => item.category))];

    return (
        <CartProvider truck={truck}>
            <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-24">
                <TruckHeader truck={truck} />
                <MenuBrowser
                    menuItems={truck.menuItems}
                    categories={categories}
                    truckId={truck.id}
                />
                <CartDrawer truck={truck} />
            </div>
        </CartProvider>
    );
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
