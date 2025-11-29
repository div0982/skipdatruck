// Order Confirmation & Tracking Page
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import OrderDetails from '@/components/order/OrderDetails';
import OrderTracking from '@/components/order/OrderTracking';

export default async function OrderPage({ params }: {
    params: Promise<{ id: string }>
}) {
    // In Next.js 16, params is a Promise
    const { id } = await params;

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            truck: true,
        },
    });

    if (!order) {
        notFound();
    }

    // Clear cart from session storage (client-side will handle this)

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Success Header */}
                <div className="text-center mb-8 animate-in">
                    <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
                        <svg
                            className="w-10 h-10 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Order Confirmed!
                    </h1>
                    <p className="text-gray-600">
                        Your order has been placed successfully
                    </p>
                </div>

                {/* Order Details */}
                <OrderDetails order={order} />

                {/* Order Tracking */}
                <OrderTracking order={order} />
            </div>
        </div>
    );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const order = await prisma.order.findUnique({
        where: { id },
    });

    return {
        title: order ? `Order ${order.orderNumber}` : 'Order Not Found',
    };
}
