'use client';

// Order Details Component
import { Order, FoodTruck } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';
import { Calendar, MapPin, Receipt } from 'lucide-react';

interface OrderDetailsProps {
    order: Order & {
        truck: FoodTruck;
    };
}

export default function OrderDetails({ order }: OrderDetailsProps) {
    const items = order.items as Array<{
        name: string;
        price: number;
        quantity: number;
    }>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 mb-6">
            {/* Order Number */}
            <div className="pb-4 border-b">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Receipt className="w-4 h-4" />
                    <span>Order Number</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{order.orderNumber}</p>
            </div>

            {/* Truck Info */}
            <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                    <p className="font-semibold text-gray-900">{order.truck.name}</p>
                    <p className="text-sm text-gray-600">{order.truck.address}</p>
                </div>
            </div>

            {/* Order Time */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{new Date(order.createdAt).toLocaleString('en-CA', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                })}</span>
            </div>

            {/* Items */}
            <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-gray-900">Items</h3>
                {items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                            {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium">
                            {formatCurrency(item.price * item.quantity)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Pricing */}
            <div className="space-y-2 text-sm pt-4 border-t">
                <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatCurrency(order.tax)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Service Fee</span>
                    <span>{formatCurrency(order.platformFee)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total Paid</span>
                    <span className="text-purple-600">{formatCurrency(order.total)}</span>
                </div>
            </div>
        </div>
    );
}
