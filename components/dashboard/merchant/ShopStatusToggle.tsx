'use client';

// Shop Status Toggle - Allows merchants to open/pause/close their shop
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ShopStatusToggleProps {
    truckId: string;
    initialStatus: 'OPEN' | 'PAUSED' | 'CLOSED';
}

const statusConfig = {
    OPEN: {
        label: 'Open',
        icon: '🟢',
        color: 'bg-green-500',
        hoverColor: 'hover:bg-green-600',
        ringColor: 'ring-green-500',
        description: 'Accepting orders',
    },
    PAUSED: {
        label: 'Paused',
        icon: '⏸️',
        color: 'bg-yellow-500',
        hoverColor: 'hover:bg-yellow-600',
        ringColor: 'ring-yellow-500',
        description: 'Temporarily not accepting orders',
    },
    CLOSED: {
        label: 'Closed',
        icon: '🔴',
        color: 'bg-red-500',
        hoverColor: 'hover:bg-red-600',
        ringColor: 'ring-red-500',
        description: 'Not accepting orders',
    },
};

export default function ShopStatusToggle({ truckId, initialStatus }: ShopStatusToggleProps) {
    const [status, setStatus] = useState<'OPEN' | 'PAUSED' | 'CLOSED'>(initialStatus);
    const [updating, setUpdating] = useState(false);

    const updateStatus = async (newStatus: 'OPEN' | 'PAUSED' | 'CLOSED') => {
        if (newStatus === status || updating) return;

        setUpdating(true);
        try {
            const response = await fetch(`/api/trucks/${truckId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shopStatus: newStatus }),
            });

            if (response.ok) {
                setStatus(newStatus);
            } else {
                console.error('Failed to update shop status');
            }
        } catch (error) {
            console.error('Error updating shop status:', error);
        } finally {
            setUpdating(false);
        }
    };

    const currentConfig = statusConfig[status];

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900">Shop Status</h3>
                    <p className="text-sm text-gray-500">{currentConfig.description}</p>
                </div>
                <div className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-white font-medium text-sm',
                    currentConfig.color
                )}>
                    <span>{currentConfig.icon}</span>
                    <span>{currentConfig.label}</span>
                </div>
            </div>

            <div className="flex gap-2">
                {(Object.keys(statusConfig) as Array<'OPEN' | 'PAUSED' | 'CLOSED'>).map((key) => {
                    const config = statusConfig[key];
                    const isActive = status === key;

                    return (
                        <button
                            key={key}
                            onClick={() => updateStatus(key)}
                            disabled={updating}
                            className={cn(
                                'flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all',
                                'border-2 flex items-center justify-center gap-2',
                                isActive
                                    ? `${config.color} text-white border-transparent ring-2 ${config.ringColor} ring-offset-2`
                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
                                updating && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                        </button>
                    );
                })}
            </div>

            {status === 'PAUSED' && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        ⚠️ Customers will see a "Temporarily Paused" message and cannot place new orders.
                    </p>
                </div>
            )}

            {status === 'CLOSED' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                        🔴 Shop is closed. Customers cannot view or order from your menu.
                    </p>
                </div>
            )}
        </div>
    );
}
