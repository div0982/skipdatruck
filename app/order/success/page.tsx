'use client';

// Order Success Page - Shows order confirmation after payment
// Polls for order by orderNumber (order is created by webhook after payment)

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OrderDetails from '@/components/order/OrderDetails';
import OrderTracking from '@/components/order/OrderTracking';

interface Order {
    id: string;
    orderNumber: string;
    truck: any;
    items: any;
    subtotal: number;
    tax: number;
    platformFee: number;
    total: number;
    status: string;
    createdAt: string;
    [key: string]: any;
}

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const orderNumber = searchParams.get('orderNumber');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [attempts, setAttempts] = useState(0);
    const maxAttempts = 20; // Poll for up to 20 seconds (20 * 1 second)

    useEffect(() => {
        if (!orderNumber) return;

        // Get payment intent ID from URL or session storage
        const urlParams = new URLSearchParams(window.location.search);
        const paymentIntentId = urlParams.get('payment_intent') || 
                               urlParams.get('payment_intent_client_secret')?.split('_secret_')[0] ||
                               sessionStorage.getItem('lastPaymentIntentId');

        const fetchOrder = async () => {
            try {
                // First, try to find the order
                const response = await fetch(`/api/orders?orderNumber=${orderNumber}`);
                if (response.ok) {
                    const orders = await response.json();
                    const foundOrder = orders.find((o: Order) => o.orderNumber === orderNumber);
                    if (foundOrder) {
                        setOrder(foundOrder);
                        setLoading(false);
                        // Clear cart
                        sessionStorage.removeItem('cart');
                        sessionStorage.removeItem('lastPaymentIntentId');
                        return;
                    }
                }

                // If order not found and we have payment intent ID, try fallback creation
                if (paymentIntentId && attempts >= 3) {
                    // After 3 attempts (3 seconds), try to create order from payment intent
                    try {
                        const createResponse = await fetch('/api/orders/create-from-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                paymentIntentId: paymentIntentId.replace('pi_', ''),
                                orderNumber,
                            }),
                        });

                        if (createResponse.ok) {
                            const data = await createResponse.json();
                            if (data.order) {
                                setOrder(data.order);
                                setLoading(false);
                                sessionStorage.removeItem('cart');
                                sessionStorage.removeItem('lastPaymentIntentId');
                                return;
                            }
                        }
                    } catch (createError) {
                        console.error('Failed to create order from payment intent:', createError);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch order:', error);
            }

            // If not found and haven't exceeded max attempts, try again
            if (attempts < maxAttempts) {
                setAttempts(prev => prev + 1);
                setTimeout(fetchOrder, 1000); // Poll every 1 second
            } else {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderNumber, attempts]);

    if (!orderNumber) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Invalid order number</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Processing Your Order...
                    </h1>
                    <p className="text-gray-600">
                        Please wait while we confirm your payment
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Order Number: {orderNumber}
                    </p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Order Not Found
                    </h1>
                    <p className="text-gray-600 mb-4">
                        We couldn't find your order. This might take a few moments to process.
                    </p>
                    <p className="text-sm text-gray-500">
                        Order Number: {orderNumber}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Please check your email for confirmation or contact support.
                    </p>
                </div>
            </div>
        );
    }

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

export default function OrderSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Loading...
                        </h1>
                        <p className="text-gray-600">
                            Please wait
                        </p>
                    </div>
                </div>
            }
        >
            <OrderSuccessContent />
        </Suspense>
    );
}

