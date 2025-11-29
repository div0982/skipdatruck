'use client';

// Order Summary Component
import { Province } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';
import { getTaxLabel } from '@/lib/tax-calculator';
import { Info } from 'lucide-react';

interface OrderSummaryProps {
    items: Array<{
        name: string;
        price: number;
        quantity: number;
    }>;
    subtotal: number;
    tax: number;
    platformFee: number;
    total: number;
    province: Province;
}

export default function OrderSummary({
    items,
    subtotal,
    tax,
    platformFee,
    total,
    province,
}: OrderSummaryProps) {
    const taxLabel = getTaxLabel(province);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 pb-4 border-b">
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

            {/* Pricing Breakdown */}
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-600">{taxLabel}</span>
                    <span className="font-medium">{formatCurrency(tax)}</span>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                        <span className="text-gray-600">Service Fee</span>
                        <div className="group relative">
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-lg">
                                Platform service fee: 4% + $0.10 CAD
                            </div>
                        </div>
                    </div>
                    <span className="font-medium">{formatCurrency(platformFee)}</span>
                </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t">
                <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">{formatCurrency(total)}</span>
                </div>
            </div>
        </div>
    );
}
