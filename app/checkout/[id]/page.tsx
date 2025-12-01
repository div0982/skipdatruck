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
orderId = { orderId }
truckId = { cartData.truckId }
total = { feeBreakdown.total }
    />
                    </Elements >
                )}
            </div >
        </div >
    );
}
