'use client';

// Truck Header Component - Clean and Simple
import { MapPin } from 'lucide-react';

interface TruckHeaderProps {
    truck: {
        name: string;
        description?: string | null;
        address: string;
        logoUrl?: string | null;
        bannerUrl?: string | null;
    };
}

export default function TruckHeader({ truck }: TruckHeaderProps) {
    return (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Truck Name */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {truck.name}
                </h1>

                {/* Description */}
                {truck.description && (
                    <p className="text-gray-600 mb-3">
                        {truck.description}
                    </p>
                )}

                {/* Address */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{truck.address}</span>
                </div>
            </div>
        </div>
    );
}
