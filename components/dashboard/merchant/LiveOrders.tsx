'use client';

// Live Orders Component with realtime updates and pickup confirmation
import { useEffect, useState } from 'react';
import { Order } from '@prisma/client';
import { formatCurrency, formatTimeEST } from '@/lib/utils';
import { Clock, ChefHat, CheckCircle, XCircle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveOrdersProps {
    truckId: string;
}

// Extended Order type with pickup code (until DB migration completes)
type OrderWithPickupCode = Order & {
    pickupCode?: string | null;
};


export default function LiveOrders({ truckId }: LiveOrdersProps) {
    const [orders, setOrders] = useState<OrderWithPickupCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
    const [pickupCodeInput, setPickupCodeInput] = useState('');
    const [pickupError, setPickupError] = useState('');

    // Fetch and poll for orders
    useEffect(() => {
        fetchOrders();

        const interval = setInterval(fetchOrders, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [truckId]);

    const fetchOrders = async () => {
        try {
            // API already filters to only show orders where payment succeeded
            const response = await fetch(`/api/orders?truckId=${truckId}&status=PENDING,PREPARING,READY`);
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            const data = await response.json();
            setOrders(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, status: string) => {
        try {
            await fetch('/api/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status }),
            });

            // Play sound notification
            playNotificationSound();

            fetchOrders();
        } catch (error) {
            console.error('Failed to update order:', error);
        }
    };

    const handlePickupConfirm = async () => {
        if (!confirmingOrderId) return;

        setPickupError('');

        try {
            const response = await fetch('/api/pickup/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: confirmingOrderId,
                    pickupCode: pickupCodeInput,
                    staffName: 'Staff', // You can add staff name input if needed
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setPickupError(data.error || 'Failed to confirm pickup');
                return;
            }

            // Success - close modal and refresh
            setConfirmingOrderId(null);
            setPickupCodeInput('');
            playNotificationSound();
            fetchOrders();
        } catch (error) {
            setPickupError('Network error. Please try again.');
        }
    };

    const playNotificationSound = () => {
        // Simple beep (you can replace with actual sound file)
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => { }); // Ignore errors if sound file doesn't exist
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'PENDING':
                return {
                    icon: Clock,
                    label: 'New Order',
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                };
            case 'PREPARING':
                return {
                    icon: ChefHat,
                    label: 'Preparing',
                    color: 'text-orange-600',
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                };
            case 'READY':
                return {
                    icon: Package,
                    label: 'Ready for Pickup',
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                };
            default:
                return {
                    icon: XCircle,
                    label: status,
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                };
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-lg font-bold mb-4">Live Orders</h2>
                <div className="text-center py-8 text-gray-500">Loading orders...</div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Live Orders</h2>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm text-gray-600">Live</span>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>No active orders</p>
                        <p className="text-sm mt-2">New orders will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const items = order.items as Array<{ name: string; quantity: number; price: number }>;
                            const config = getStatusConfig(order.status);
                            const Icon = config.icon;

                            return (
                                <div
                                    key={order.id}
                                    className={cn(
                                        'p-4 rounded-xl border-2 transition-all',
                                        config.borderColor,
                                        config.bgColor
                                    )}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn('w-10 h-10 rounded-full bg-white flex items-center justify-center', config.color)}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{order.orderNumber}</h3>
                                                <p className="text-sm text-gray-600">
                                                    {formatTimeEST(order.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={cn('px-3 py-1 rounded-full text-sm font-semibold', config.color, 'bg-white')}>
                                            {config.label}
                                        </span>
                                    </div>

                                    {/* Items */}
                                    <div className="mb-3 space-y-1">
                                        {items.map((item, idx) => (
                                            <p key={idx} className="text-sm text-gray-700">
                                                {item.quantity}x {item.name}
                                            </p>
                                        ))}
                                    </div>

                                    {/* Total */}
                                    <div className="flex items-center justify-between mb-4 pt-3 border-t border-gray-200">
                                        <span className="text-sm font-medium text-gray-600">Total</span>
                                        <span className="text-lg font-bold text-gray-900">
                                            {formatCurrency(order.total)}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {order.status === 'PENDING' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                                Start Preparing
                                            </button>
                                        )}
                                        {order.status === 'PREPARING' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'READY')}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                                Mark as Ready
                                            </button>
                                        )}
                                        {order.status === 'READY' && (
                                            <button
                                                onClick={() => {
                                                    setConfirmingOrderId(order.id);
                                                    setPickupCodeInput('');
                                                    setPickupError('');
                                                }}
                                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                                Confirm Pickup
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pickup Confirmation Modal */}
            {confirmingOrderId && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setConfirmingOrderId(null)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <h3 className="text-xl font-bold mb-2">Confirm Pickup</h3>
                            <p className="text-gray-600 mb-6">
                                Ask customer for their 4-digit pickup code
                            </p>

                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                value={pickupCodeInput}
                                onChange={(e) => setPickupCodeInput(e.target.value.replace(/\D/g, ''))}
                                placeholder="0000"
                                className="w-full text-center text-4xl font-bold tracking-widest p-4 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none mb-4"
                                autoFocus
                            />

                            {pickupError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                                    {pickupError}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmingOrderId(null)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePickupConfirm}
                                    disabled={pickupCodeInput.length !== 4}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-colors">
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
