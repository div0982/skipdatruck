'use client';

// Order Success Page - Shows order confirmation after payment
// Polls for order by orderNumber (order is created by webhook after payment)

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import OrderDetails from '@/components/order/OrderDetails';
import OrderTracking from '@/components/order/OrderTracking';

interface Order {
    id: string;
    orderNumber: string;
    pickupCode?: string;  // Add pickup code
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
    const fallbackCalledRef = useRef(false); // Track if we've already called the fallback
    const pollingStoppedRef = useRef(false); // Track if we've stopped polling

    useEffect(() => {
        if (!orderNumber) return;

        // Get payment intent ID from URL or session storage
        const urlParams = new URLSearchParams(window.location.search);
        let paymentIntentId = urlParams.get('payment_intent');

        // If not in URL, try to extract from client_secret or get from session storage
        if (!paymentIntentId) {
            const clientSecret = urlParams.get('payment_intent_client_secret');
            if (clientSecret) {
                paymentIntentId = clientSecret.split('_secret_')[0];
            } else {
                paymentIntentId = sessionStorage.getItem('lastPaymentIntentId');
            }
        }

        const fetchOrder = async () => {
            // Stop polling if we've already found the order or stopped polling
            if (pollingStoppedRef.current || order) {
                return;
            }

            try {
                // First, try to find the order
                const response = await fetch(`/api/orders?orderNumber=${orderNumber}`);
                if (response.ok) {
                    const orders = await response.json();
                    const foundOrder = orders.find((o: Order) => o.orderNumber === orderNumber);
                    if (foundOrder) {
                        console.log(`✅ Order found via webhook: ${orderNumber} (Attempt ${attempts + 1})`);
                        setOrder(foundOrder);
                        setLoading(false);
                        pollingStoppedRef.current = true; // Stop polling
                        // Clear cart
                        sessionStorage.removeItem('cart');
                        sessionStorage.removeItem('lastPaymentIntentId');
                        return;
                    }
                }

                // If order not found and we have payment intent ID, try fallback creation (ONLY ONCE)
                if (paymentIntentId && attempts >= 3 && !fallbackCalledRef.current) {
                    // Mark that we've called the fallback to prevent duplicate calls
                    fallbackCalledRef.current = true;

                    // After 3 attempts (3 seconds), try to create order from payment intent
                    console.log(`⚠️ Order not found after ${attempts + 1} attempts. Using FALLBACK to create order from payment intent...`);
                    console.log(`📋 Payment Intent ID: ${paymentIntentId}`);
                    console.log(`📋 Order Number: ${orderNumber}`);

                    try {
                        // Ensure payment intent ID has 'pi_' prefix
                        const formattedPaymentIntentId = paymentIntentId.startsWith('pi_')
                            ? paymentIntentId
                            : `pi_${paymentIntentId}`;

                        console.log(`🔄 Calling fallback API with Payment Intent: ${formattedPaymentIntentId}`);

                        const createResponse = await fetch('/api/orders/create-from-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                paymentIntentId: formattedPaymentIntentId,
                                orderNumber,
                            }),
                        });

                        if (createResponse.ok) {
                            const data = await createResponse.json();
                            if (data.order) {
                                console.log(`✅ FALLBACK SUCCESS: Order created from payment intent!`);
                                console.log(`📦 Order ID: ${data.order.id}`);
                                console.log(`📦 Order Number: ${data.order.orderNumber}`);
                                setOrder(data.order);
                                setLoading(false);
                                pollingStoppedRef.current = true; // Stop polling
                                sessionStorage.removeItem('cart');
                                sessionStorage.removeItem('lastPaymentIntentId');
                                return;
                            } else {
                                console.warn(`⚠️ Fallback API returned success but no order in response`);
                            }
                        } else {
                            const errorData = await createResponse.json().catch(() => ({ error: 'Unknown error' }));
                            const errorMessage = errorData.error || 'Unknown error';
                            console.error(`❌ FALLBACK FAILED: ${errorMessage}`);

                            // If the error is "order already exists", that's actually fine - the webhook probably created it
                            // Continue polling to find it
                            if (errorMessage.includes('Unique constraint') || errorMessage.includes('already exists')) {
                                console.log(`ℹ️ Order already exists (likely created by webhook). Continuing to poll...`);
                                fallbackCalledRef.current = false; // Allow retry if needed, but we'll continue polling
                            }
                        }
                    } catch (createError) {
                        console.error('❌ FALLBACK ERROR: Failed to create order from payment intent:', createError);
                    }
                } else if (attempts < 3) {
                    console.log(`⏳ Waiting for webhook... (Attempt ${attempts + 1}/${maxAttempts})`);
                } else if (!paymentIntentId) {
                    console.warn(`⚠️ No payment intent ID available for fallback. Order may not be created if webhook fails.`);
                }
            } catch (error) {
                console.error('❌ Failed to fetch order:', error);
            }

            // If not found and haven't exceeded max attempts, try again
            if (!pollingStoppedRef.current && attempts < maxAttempts) {
                setAttempts(prev => prev + 1);
                setTimeout(fetchOrder, 1000); // Poll every 1 second
            } else {
                setLoading(false);
                pollingStoppedRef.current = true;
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
                    <div className="mt-6">
                        <a
                            href="/trucks"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
                        >
                            Browse Other Food Trucks
                        </a>
                    </div>
                </div>

                {/* Pickup Code Display */}
                {order.pickupCode && (
                    <div className="mb-8 bg-white rounded-2xl shadow-xl p-8 border-4 border-green-500 animate-in">
                        <div className="text-center">
                            <h2 className="text-lg font-semibold text-gray-700 mb-2">
                                Your Pickup Code
                            </h2>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 mb-4">
                                <p className="text-6xl md:text-7xl font-bold text-green-600 tracking-[0.5em] mb-2">
                                    {order.pickupCode}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-gray-700 font-medium">
                                    📱 Save this code! You'll need it to pick up your order.
                                </p>
                                <p className="text-sm text-gray-600">
                                    Show this code to the staff when your order is ready
                                </p>
                            </div>
                        </div>
                    </div>
                )}

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

