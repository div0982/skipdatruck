'use client';

// Checkout Page - Payment with Apple Pay, Google Pay, Card
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import { Province } from '@prisma/client';
import { ArrowLeft } from 'lucide-react';

// Initialize Stripe - will be set in component
let stripePromise: ReturnType<typeof loadStripe> | null = null;

const getStripe = () => {
    if (!stripePromise) {
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) {
            throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
        }
        stripePromise = loadStripe(publishableKey);
    }
    return stripePromise;
};

interface CartData {
    items: Array<{
        menuItemId: string;
        name: string;
        price: number;
        quantity: number;
    }>;
    truckId: string;
    truckName: string;
    province: Province;
    taxRate: number;
}

interface FeeBreakdown {
    subtotal: number;
    tax: number;
    platformFee: number;
    total: number;
}

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [cartData, setCartData] = useState<CartData | null>(null);
    const [clientSecret, setClientSecret] = useState<string>('');
    const [orderId, setOrderId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [truckId, setTruckId] = useState<string>('');
    const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
    const hasCreatedIntentRef = useRef(false);

    useEffect(() => {
        // In Next.js 16, params is a Promise
        params.then(({ id }) => {
            setTruckId(id);

            // Load cart from session storage
            const savedCart = sessionStorage.getItem('cart');
            if (!savedCart) {
                router.push(`/t/${id}`);
                return;
            }

            const cart: CartData = JSON.parse(savedCart);
            setCartData(cart);

            // Create payment intent (guard against double-call in React Strict Mode)
            if (!hasCreatedIntentRef.current) {
                hasCreatedIntentRef.current = true;
                createPaymentIntent(cart);
            }
        });
    }, [params, router]);

    const createPaymentIntent = async (cart: CartData) => {
        try {
            const response = await fetch('/api/payment/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    truckId: cart.truckId,
                    items: cart.items,
                    customerInfo: {
                        // Can add customer info here if needed
                    },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Create payment intent failed:', data);
                throw new Error(data.error || 'Failed to create payment intent');
            }

            setClientSecret(data.clientSecret);
            setOrderId(data.orderId);

            // Store the actual fee breakdown from the API response
            setFeeBreakdown({
                subtotal: data.breakdown.subtotal,
                tax: data.breakdown.tax,
                platformFee: data.breakdown.platformFee,
                total: data.breakdown.total,
            });

            setLoading(false);
        } catch (error: any) {
            console.error('Payment intent error:', error);
            alert(error?.message || 'Failed to initialize payment. Please try again.');
            if (truckId) {
                router.push(`/t/${truckId}`);
            } else {
                router.push('/');
            }
        }
    };

    if (loading || !cartData || !feeBreakdown) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-gray-600">Preparing checkout...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">Checkout</h1>
                        <p className="text-sm text-gray-600">{cartData.truckName}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Order Summary */}
                <OrderSummary
                    items={cartData.items}
                    subtotal={feeBreakdown.subtotal}
                    tax={feeBreakdown.tax}
                    platformFee={feeBreakdown.platformFee}
                    total={feeBreakdown.total}
                    province={cartData.province}
                />

                {/* Payment Form */}
                {clientSecret && (
                    <Elements stripe={getStripe()} options={{ clientSecret }}>
                        <CheckoutForm
                            orderId={orderId}
                            truckId={cartData.truckId}
                            total={feeBreakdown.total}
                        />
                    </Elements>
                )}
            </div>
        </div>
    );
}
