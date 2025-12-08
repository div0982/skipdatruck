'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, User, TruckIcon, DollarSign } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [businessModel, setBusinessModel] = useState('MERCHANT_PAYS_FEES'); // Default to recommended
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            // Create account with business model
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, businessModel }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to create account');
                setLoading(false);
                return;
            }

            // Auto login after signup
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Account created but login failed. Please try logging in.');
                setLoading(false);
                return;
            }

            // Redirect to truck registration
            router.push('/dashboard/merchant/register');
            router.refresh();
        } catch (err) {
            setError('Something went wrong');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-4">
                        <TruckIcon className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Create Merchant Account
                    </h1>
                    <p className="text-gray-600">
                        Start accepting orders for your food truck
                    </p>
                </div>

                {/* Signup Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="John Doe"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="merchant@example.com"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Business Model Selection */}
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-5 rounded-xl border border-purple-200">
                            <div className="flex items-center gap-2 mb-3">
                                <DollarSign className="w-5 h-5 text-purple-600" />
                                <label className="block text-sm font-semibold text-gray-900">
                                    Choose Your Fee Model
                                </label>
                            </div>

                            <div className="space-y-3">
                                {/* Merchant Pays (Recommended) */}
                                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${businessModel === 'MERCHANT_PAYS_FEES'
                                    ? 'border-purple-600 bg-white shadow-sm'
                                    : 'border-gray-200 bg-white/50 hover:border-purple-300'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="businessModel"
                                        value="MERCHANT_PAYS_FEES"
                                        checked={businessModel === 'MERCHANT_PAYS_FEES'}
                                        onChange={(e) => setBusinessModel(e.target.value)}
                                        className="mt-1"
                                        disabled={loading}
                                    />
                                    <div className="ml-3 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">I'll Pay Stripe Fees</span>
                                            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
                                                RECOMMENDED
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            <strong>Just 3% commission</strong> - You pay Stripe directly. Lower fees for your customers, more profit for you!
                                        </p>
                                    </div>
                                </label>

                                {/* Platform Pays */}
                                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${businessModel === 'PLATFORM_PAYS_FEES'
                                    ? 'border-purple-600 bg-white shadow-sm'
                                    : 'border-gray-200 bg-white/50 hover:border-purple-300'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="businessModel"
                                        value="PLATFORM_PAYS_FEES"
                                        checked={businessModel === 'PLATFORM_PAYS_FEES'}
                                        onChange={(e) => setBusinessModel(e.target.value)}
                                        className="mt-1"
                                        disabled={loading}
                                    />
                                    <div className="ml-3 flex-1">
                                        <span className="font-semibold text-gray-900">Platform Pays Stripe Fees</span>
                                        <p className="text-sm text-gray-600 mt-1">
                                            <strong>4-7% fee</strong> - We handle all payment processing. No Stripe setup required.
                                        </p>
                                    </div>
                                </label>

                                {/* Hybrid Model */}
                                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${businessModel === 'HYBRID'
                                    ? 'border-purple-600 bg-white shadow-sm'
                                    : 'border-gray-200 bg-white/50 hover:border-purple-300'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="businessModel"
                                        value="HYBRID"
                                        checked={businessModel === 'HYBRID'}
                                        onChange={(e) => setBusinessModel(e.target.value)}
                                        className="mt-1"
                                        disabled={loading}
                                    />
                                    <div className="ml-3 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">Hybrid Model</span>
                                            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full">
                                                BEST VALUE
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            <strong>Platform pays Stripe fees + 1% application fee</strong> - We cover payment processing, you pay just 1% of each order. Maximum profit!
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            Already have an account?{' '}
                            <a
                                href="/login"
                                className="text-purple-600 hover:text-purple-700 font-semibold"
                            >
                                Sign in
                            </a>
                        </p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="mt-6 text-center">
                    <a
                        href="/"
                        className="text-gray-600 hover:text-gray-900 text-sm"
                    >
                        ← Back to home
                    </a>
                </div>
            </div>
        </div>
    );
}
