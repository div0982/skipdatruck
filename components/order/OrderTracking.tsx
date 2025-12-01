'use client';

// Order Tracking Component
import { useEffect, useState } from 'react';
import { Clock, ChefHat, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTrackingProps {
    order: {
        id: string;
        status: string;
        [key: string]: any;
    };
}

export default function OrderTracking({ order: initialOrder }: OrderTrackingProps) {
    const [order, setOrder] = useState(initialOrder);

    // Poll for order updates
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/orders/${order.id}`);
                const updatedOrder = await response.json();
                setOrder(updatedOrder);
            } catch (error) {
                console.error('Failed to fetch order update:', error);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [order.id]);

    const steps = [
        {
            status: 'PENDING',
            label: 'Order Received',
            icon: Clock,
            description: 'Your order has been received',
        },
        {
            status: 'PREPARING',
            label: 'Preparing',
            icon: ChefHat,
            description: 'Your food is being prepared',
        },
        {
            status: 'READY',
            label: 'Ready for Pickup',
            icon: CheckCircle,
            description: 'Your order is ready!',
        },
    ];

    const currentStepIndex = steps.findIndex(s => s.status === order.status);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold mb-6">Order Status</h2>

            <div className="space-y-6">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                        <div key={step.status} className="flex gap-4">
                            {/* Icon */}
                            <div className="relative">
                                <div
                                    className={cn(
                                        'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                                        isActive
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-400'
                                    )}
                                >
                                    <Icon className="w-6 h-6" />
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            'absolute top-12 left-6 w-0.5 h-8 transition-colors',
                                            isActive ? 'bg-purple-600' : 'bg-gray-200'
                                        )}
                                    />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-2">
                                <h3
                                    className={cn(
                                        'font-semibold transition-colors',
                                        isActive ? 'text-gray-900' : 'text-gray-400'
                                    )}
                                >
                                    {step.label}
                                </h3>
                                <p
                                    className={cn(
                                        'text-sm transition-colors',
                                        isActive ? 'text-gray-600' : 'text-gray-400'
                                    )}
                                >
                                    {step.description}
                                </p>
                                {isCurrent && order.status !== 'READY' && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-purple-600">
                                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                                        <span>In progress...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {order.status === 'READY' && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-green-800 font-semibold text-center">
                        🎉 Your order is ready for pickup!
                    </p>
                </div>
            )}
        </div>
    );
}
