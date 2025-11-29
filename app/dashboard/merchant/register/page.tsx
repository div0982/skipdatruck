'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Truck, MapPin, Building2 } from 'lucide-react';
import { saveTruckId } from '@/lib/truck-storage';

interface Province {
    value: string;
    label: string;
}

const PROVINCES: Province[] = [
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'YT', label: 'Yukon' },
];

export default function RegisterTruckPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        province: 'ON',
        ownerName: '',
        ownerEmail: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // First, create or get a demo user
            const userResponse = await fetch('/api/users/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.ownerName || 'Demo Owner',
                    email: formData.ownerEmail || `demo-${Date.now()}@foodtruck.local`,
                }),
            });

            if (!userResponse.ok) {
                const errorData = await userResponse.json();
                throw new Error(errorData.error || 'Failed to create user');
            }

            const user = await userResponse.json();

            // Then create the truck
            const truckResponse = await fetch('/api/trucks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerId: user.id,
                    name: formData.name,
                    description: formData.description,
                    address: formData.address,
                    province: formData.province,
                }),
            });

            if (!truckResponse.ok) {
                const errorData = await truckResponse.json();
                throw new Error(errorData.error || 'Failed to create truck');
            }

            const truck = await truckResponse.json();

            // Save truckId to localStorage
            saveTruckId(truck.id);

            // Redirect to dashboard
            router.push(`/dashboard/merchant?truckId=${truck.id}`);
        } catch (err: any) {
            setError(err.message || 'Failed to register truck');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                            <Truck className="w-8 h-8 text-purple-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Register Your Food Truck
                        </h1>
                        <p className="text-gray-600">
                            Get started by registering your food truck
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Truck Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Truck Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="e.g., Miguel's Tacos"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Tell customers about your food truck..."
                                rows={3}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none resize-none"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Address *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.address}
                                onChange={(e) =>
                                    setFormData({ ...formData, address: e.target.value })
                                }
                                placeholder="e.g., 123 Main St, Toronto, ON"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                            />
                        </div>

                        {/* Province */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Province *
                            </label>
                            <select
                                required
                                value={formData.province}
                                onChange={(e) =>
                                    setFormData({ ...formData, province: e.target.value })
                                }
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                            >
                                {PROVINCES.map((province) => (
                                    <option key={province.value} value={province.value}>
                                        {province.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Owner Info (Optional for demo) */}
                        <div className="border-t pt-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-4">
                                Owner Information (Optional)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Owner Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.ownerName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, ownerName: e.target.value })
                                        }
                                        placeholder="Your name"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Owner Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.ownerEmail}
                                        onChange={(e) =>
                                            setFormData({ ...formData, ownerEmail: e.target.value })
                                        }
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                If not provided, a demo account will be created automatically
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                <>
                                    <Truck className="w-5 h-5" />
                                    Register Food Truck
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

