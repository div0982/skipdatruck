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
                    truckId={cartData.truckId}
                    total={feeBreakdown.total}
                    />
                </Elements>
            )}
            </div>
        </div>
        );
}
