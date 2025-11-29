'use client';

// Checkout Form with Stripe Payment Element
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, Loader2 } from 'lucide-react';

interface CheckoutFormProps {
    orderId: string;
    truckId: string;
    total: number;
}

export default function CheckoutForm({ orderId, truckId, total }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/order/${orderId}`,
                },
            });

            if (error) {
                setErrorMessage(error.message || 'Payment failed');
                setLoading(false);
            }
        } catch (error) {
            setErrorMessage('An unexpected error occurred');
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold">Payment Method</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Stripe Payment Element - includes Apple Pay, Google Pay, and card */}
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        wallets: {
                            applePay: 'auto',
                            googlePay: 'auto',
                        },
                    }}
                />

                {/* Error Message */}
                {errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {errorMessage}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!stripe || loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <span>Pay {formatCurrency(total)}</span>
                    )}
                </button>

                {/* Security Note */}
                <p className="text-xs text-center text-gray-500">
                    🔒 Payments are securely processed by Stripe
                </p>
            </form>
        </div>
    );
}
