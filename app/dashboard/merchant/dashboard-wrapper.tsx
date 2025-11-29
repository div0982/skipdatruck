'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTruckId, saveTruckId } from '@/lib/truck-storage';

export default function DashboardWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const urlTruckId = searchParams.get('truckId');
        const storedTruckId = getTruckId();

        // If we have a truckId in URL, save it to localStorage
        if (urlTruckId) {
            saveTruckId(urlTruckId);
        }
        // If we have stored truckId but no URL param, update URL
        else if (storedTruckId) {
            router.replace(`/dashboard/merchant?truckId=${storedTruckId}`);
        }
    }, [searchParams, router]);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

