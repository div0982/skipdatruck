'use client';

// Truck Header Component
import { MapPin, Phone } from 'lucide-react';
import Image from 'next/image';

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
        <div className="relative">
            {/* Banner Image */}
            {truck.bannerUrl ? (
                <div className="relative h-48 w-full">
                    <Image
                        src={truck.bannerUrl}
                        alt={truck.name}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
            ) : (
                <div className="h-48 w-full bg-gradient-to-br from-purple-600 to-purple-400" />
            )}

            {/* Truck Info */}
            <div className="relative px-4 -mt-12">
                <div className="flex items-end gap-4">
                    {/* Logo */}
                    {truck.logoUrl ? (
                        <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-white">
                            <Image
                                src={truck.logoUrl}
                                alt={truck.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-white shadow-xl flex items-center justify-center">
                            <span className="text-white text-3xl font-bold">
                                {truck.name.charAt(0)}
                            </span>
                        </div>
                    )}

                    {/* Truck Name */}
                    <div className="flex-1 pb-2">
                        <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                            {truck.name}
                        </h1>
                    </div>
                </div>

                {/* Description & Address */}
                <div className="mt-4 space-y-2">
                    {truck.description && (
                        <p className="text-gray-700">{truck.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{truck.address}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
