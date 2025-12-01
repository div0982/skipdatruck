'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface StripeConnectButtonProps {
    truckId: string;
    truckName: string;
}

export default function StripeConnectButton({ truckId, truckName }: StripeConnectButtonProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [status, setStatus] = useState<{
        connected: boolean;
        onboarded: boolean;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check onboarding status on mount and every 3 seconds until onboarded
    useEffect(() => {
        if (!session?.user?.id) return;

        checkStatus();

        // If not onboarded, keep checking every 3 seconds
        const interval = setInterval(() => {
            if (status && !status.onboarded) {
                checkStatus();
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [session?.user?.id, status?.onboarded]);

    const checkStatus = async () => {
        if (!session?.user?.id) return;

        try {
            const res = await fetch(`/api/connect?userId=${session.user.id}`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            console.error('Failed to check Connect status:', err);
            // Set error state but don't block UI
            setError('Unable to check connection status. Please try again.');
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleConnect = async () => {
        if (!session?.user?.email || !session?.user?.id) {
            setError('Please log in to connect to Stripe');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session.user.id,
                    email: session.user.email,
                    truckId: truckId,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.url) {
                // Redirect to Stripe onboarding
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'No redirect URL received from Stripe');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            setLoading(false);
        }
    };

    // Loading while checking status
    if (checkingStatus) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-6 w-6 text-purple-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-sm text-gray-600">Checking Stripe connection status...</p>
                </div>
            </div>
        );
    }

    // Already onboarded
    if (status?.onboarded) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-green-900">Stripe Connected</h3>
                        <p className="text-sm text-green-700">You can now accept payments!</p>
                    </div>
                </div>
            </div>
        );
    }

    // Not connected or pending
    return (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-yellow-900 mb-2">
                        Connect to Stripe Required
                    </h3>
                    <p className="text-sm text-yellow-800 mb-4">
                        Connect your <strong>{truckName}</strong> to Stripe to start accepting payments from customers.
                        This is a one-time setup that takes about 5 minutes.
                    </p>

                    {error && (
                        <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleConnect}
                        disabled={loading}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Connecting...
                            </span>
                        ) : (
                            '🚀 Connect to Stripe'
                        )}
                    </button>

                    <p className="text-xs text-yellow-700 mt-3">
                        You'll be redirected to Stripe to complete a secure onboarding process
                    </p>
                </div>
            </div>
        </div>
    );
}
