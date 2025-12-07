'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ShopStatusMonitorProps {
    truckId: string;
    initialStatus: string;
}

export default function ShopStatusMonitor({ truckId, initialStatus }: ShopStatusMonitorProps) {
    const [shopStatus, setShopStatus] = useState(initialStatus);
    const router = useRouter();

    useEffect(() => {
        // Poll shop status every 10 seconds
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/trucks/check/${truckId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.shopStatus !== shopStatus) {
                        // Status changed - refresh the page to update UI
                        setShopStatus(data.shopStatus);
                        router.refresh();
                    }
                }
            } catch (error) {
                console.error('Failed to check shop status:', error);
            }
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, [truckId, shopStatus, router]);

    // This component doesn't render anything, it just monitors in the background
    return null;
}
