'use client';

// Live Orders Component with realtime updates and pickup confirmation
import { useEffect, useState } from 'react';
import { Order } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';
import { Clock, ChefHat, CheckCircle, XCircle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveOrdersProps {
    truckId: string;
}

export default function LiveOrders({ truckId }: LiveOrdersProps) {
    const [orders, setOrders] = useState\u003cOrder[]\u003e([]);
    const [loading, setLoading] = useState(true);
    const [confirmingOrderId, setConfirmingOrderId] = useState\u003cstring | null\u003e(null);
    const [pickupCodeInput, setPickupCodeInput] = useState('');
    const [pickupError, setPickupError] = useState('');

    // Fetch and poll for orders
    useEffect(() =\u003e {
        fetchOrders();

        const interval = setInterval(fetchOrders, 3000); // Poll every 3 seconds

        return() =\u003e clearInterval(interval);
    }, [truckId]);

    const fetchOrders = async() =\u003e {
        try {
            // API already filters to only show orders where payment succeeded
            const response = await fetch(`/api/orders?truckId=${truckId}\u0026status=PENDING,PREPARING,READY`);
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

const updateOrderStatus = async (orderId: string, status: string) =\u003e {
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

const handlePickupConfirm = async() =\u003e {
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

const playNotificationSound = () =\u003e {
    // Simple beep (you can replace with actual sound file)
    const audio = new Audio('/notification.mp3');
audio.play().catch(() =\u003e {}); // Ignore errors if sound file doesn't exist
    };

const getStatusConfig = (status: string) =\u003e {
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
    \u003cdiv className =\"bg-white rounded-xl p-6 border border-gray-200\"\u003e
    \u003ch2 className =\"text-lg font-bold mb-4\"\u003eLive Orders\u003c/h2\u003e
    \u003cdiv className =\"text-center py-8 text-gray-500\"\u003eLoading orders...\u003c/div\u003e
    \u003c / div\u003e
        );
}

return (
\u003c\u003e
\u003cdiv className =\"bg-white rounded-xl p-6 border border-gray-200\"\u003e
\u003cdiv className =\"flex items-center justify-between mb-4\"\u003e
\u003ch2 className =\"text-lg font-bold\"\u003eLive Orders\u003c/h2\u003e
\u003cdiv className =\"flex items-center gap-2\"\u003e
\u003cdiv className =\"w-2 h-2 bg-green-500 rounded-full animate-pulse\" /\u003e
\u003cspan className =\"text-sm text-gray-600\"\u003eLive\u003c/span\u003e
\u003c / div\u003e
\u003c / div\u003e

{
    orders.length === 0 ? (
    \u003cdiv className =\"text-center py-12 text-gray-500\"\u003e
    \u003cp\u003eNo active orders\u003c / p\u003e
    \u003cp className =\"text-sm mt-2\"\u003eNew orders will appear here\u003c/p\u003e
    \u003c / div\u003e
                ) : (
    \u003cdiv className =\"space-y-4\"\u003e
    {
        orders.map((order) =\u003e {
            const items = order.items as Array\u003c{ name: string; quantity: number; price: number }\u003e;
        const config = getStatusConfig(order.status);
        const Icon = config.icon;

        return (
        \u003cdiv
        key = { order.id }
        className = {
            cn(
                                        'p-4 rounded-xl border-2 transition-all',
                config.borderColor,
            config.bgColor
                                    )
        }
        \u003e
        {/* Header */ }
        \u003cdiv className =\"flex items-center justify-between mb-3\"\u003e
        \u003cdiv className =\"flex items-center gap-3\"\u003e
        \u003cdiv className = { cn('w-10 h-10 rounded-full bg-white flex items-center justify-center', config.color) }\u003e
        \u003cIcon className =\"w-5 h-5\" /\u003e
        \u003c / div\u003e
        \u003cdiv\u003e
        \u003ch3 className =\"font-bold text-gray-900\"\u003e{order.orderNumber}\u003c/h3\u003e
        \u003cp className =\"text-sm text-gray-600\"\u003e
        {
            new Date(order.createdAt).toLocaleTimeString('en-CA', {
                hour: '2-digit',
                minute: '2-digit',
            })
        }
        \u003c / p\u003e
        \u003c / div\u003e
        \u003c / div\u003e
        \u003cspan className = { cn('px-3 py-1 rounded-full text-sm font-semibold', config.color, 'bg-white') }\u003e
        { config.label }
        \u003c / span\u003e
        \u003c / div\u003e

        {/* Items */ }
        \u003cdiv className =\"mb-3 space-y-1\"\u003e
        {
            items.map((item, idx) =\u003e(
                \u003cp key = { idx } className =\"text-sm text-gray-700\"\u003e
                                                { item.quantity }x { item.name }
                \u003c / p\u003e
            ))
        }
        \u003c / div\u003e

        {/* Pickup Code for READY orders */ }
        {
            order.status === 'READY' \u0026\u0026 order.pickupCode \u0026\u0026(
                \u003cdiv className =\"mb-3 p-3 bg-white rounded-lg border-2 border-green-300\"\u003e
                \u003cp className =\"text-xs text-gray-600 mb-1\"\u003ePickup Code:\u003c/p\u003e
                \u003cp className =\"text-3xl font-bold text-green-600 tracking-widest\"\u003e{order.pickupCode}\u003c/p\u003e
                \u003cp className =\"text-xs text-gray-500 mt-1\"\u003eCustomer must provide this code\u003c/p\u003e
                \u003c / div\u003e
            )
        }

        {/* Total */ }
        \u003cdiv className =\"flex items-center justify-between mb-4 pt-3 border-t border-gray-200\"\u003e
        \u003cspan className =\"text-sm font-medium text-gray-600\"\u003eTotal\u003c/span\u003e
        \u003cspan className =\"text-lg font-bold text-gray-900\"\u003e
        { formatCurrency(order.total) }
        \u003c / span\u003e
        \u003c / div\u003e

        {/* Actions */ }
        \u003cdiv className =\"flex gap-2\"\u003e
        {
            order.status === 'PENDING' \u0026\u0026(
                \u003cbutton
                                                onClick = {() =\u003e updateOrderStatus(order.id, 'PREPARING')}
        className =\"flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors\"\u003e
                                                Start Preparing
        \u003c / button\u003e
                                        )
    }
    {
        order.status === 'PREPARING' \u0026\u0026(
            \u003cbutton
                                                onClick = {() =\u003e updateOrderStatus(order.id, 'READY')}
    className =\"flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors\"\u003e
    Mark as Ready
    \u003c / button\u003e
                                        )
}
{
    order.status === 'READY' \u0026\u0026(
        \u003cbutton
                                                onClick = {() =\u003e {
        setConfirmingOrderId(order.id);
    setPickupCodeInput('');
    setPickupError('');
}}
className =\"flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors\"\u003e
                                                Confirm Pickup
\u003c / button\u003e
                                        )}
\u003c / div\u003e
\u003c / div\u003e
                            );
                        })}
\u003c / div\u003e
                )}
\u003c / div\u003e

{/* Pickup Confirmation Modal */ }
{
    confirmingOrderId \u0026\u0026(
        \u003c\u003e
        \u003cdiv
                        className =\"fixed inset-0 bg-black/50 z-40\"
                        onClick = {() =\u003e setConfirmingOrderId(null)}
                    /\u003e
\u003cdiv className =\"fixed inset-0 z-50 flex items-center justify-center p-4\"\u003e
\u003cdiv className =\"bg-white rounded-2xl shadow-2xl max-w-md w-full p-6\"\u003e
\u003ch3 className =\"text-xl font-bold mb-2\"\u003eConfirm Pickup\u003c/h3\u003e
\u003cp className =\"text-gray-600 mb-6\"\u003e
                                Ask customer for their 4 - digit pickup code
\u003c / p\u003e

\u003cinput
type =\"text\"
inputMode =\"numeric\"
maxLength = { 4}
value = { pickupCodeInput }
onChange = {(e) =\u003e setPickupCodeInput(e.target.value.replace(/\D/g, ''))}
placeholder =\"0000\"
className =\"w-full text-center text-4xl font-bold tracking-widest p-4 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none mb-4\"
autoFocus
    /\u003e

{
    pickupError \u0026\u0026(
        \u003cdiv className =\"bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4\"\u003e
                                    { pickupError }
        \u003c / div\u003e
    )
}

\u003cdiv className =\"flex gap-3\"\u003e
\u003cbutton
onClick = {() =\u003e setConfirmingOrderId(null)}
className =\"flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition-colors\"\u003e
Cancel
\u003c / button\u003e
\u003cbutton
onClick = { handlePickupConfirm }
disabled = { pickupCodeInput.length !== 4 }
className =\"flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-colors\"\u003e
Confirm
\u003c / button\u003e
\u003c / div\u003e
\u003c / div\u003e
\u003c / div\u003e
\u003c /\u003e
            )}
\u003c /\u003e
    );
}
