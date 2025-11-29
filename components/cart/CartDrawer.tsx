'use client';

// Cart Drawer - Slide-up shopping cart
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from './CartProvider';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { calculateTax } from '@/lib/tax-calculator';
import { calculatePlatformFee, calculateTotal } from '@/lib/fee-calculator';
import { getTaxLabel } from '@/lib/tax-calculator';

interface CartDrawerProps {
    truck: {
        id: string;
        name: string;
        province: any;
        taxRate: number;
    };
}

export default function CartDrawer({ truck }: CartDrawerProps) {
    const { items, removeItem, updateQuantity, total, itemCount, isOpen, openCart, closeCart } = useCart();
    const router = useRouter();

    const handleCheckout = () => {
        // Save cart to session storage
        sessionStorage.setItem('cart', JSON.stringify({
            items: items.map(item => ({
                menuItemId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
            })),
            truckId: truck.id,
            truckName: truck.name,
            province: truck.province,
            taxRate: truck.taxRate,
        }));

        router.push(`/checkout/${truck.id}`);
    };

    if (!isOpen) {
        // Floating cart button
        return itemCount > 0 ? (
            <button
                onClick={openCart}
                className="fixed bottom-6 right-6 z-50 bg-purple-600 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-purple-700 transition-colors flex items-center gap-3"
            >
                <ShoppingBag className="w-6 h-6" />
                <span className="font-semibold">{itemCount} items</span>
                <span className="text-lg">{formatCurrency(total)}</span>
            </button>
        ) : null;
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 animate-in"
                onClick={closeCart}
            />

            {/* Drawer */}
            <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold">Your Order</h2>
                        <p className="text-sm text-gray-600">{itemCount} items</p>
                    </div>
                    <button
                        onClick={closeCart}
                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="flex gap-4 items-center">
                            <div className="flex-1">
                                <h3 className="font-medium">{item.name}</h3>
                                <p className="text-sm text-purple-600 font-semibold">
                                    {formatCurrency(item.price)}
                                </p>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-semibold w-6 text-center">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Remove */}
                            <button
                                onClick={() => removeItem(item.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t space-y-4 safe-bottom">
                    {/* Price Breakdown */}
                    {(() => {
                        const subtotal = total; // This is the cart subtotal
                        const convenienceFee = calculatePlatformFee(subtotal); // Fee calculated on subtotal BEFORE tax
                        const tax = calculateTax(subtotal, truck.province); // Tax calculated on subtotal
                        const finalTotal = calculateTotal(subtotal, tax, convenienceFee);
                        
                        return (
                            <>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Convenience Fee (4% + $0.10)</span>
                                        <span>{formatCurrency(convenienceFee)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>{getTaxLabel(truck.province)}</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                </div>
                                
                                {/* Total */}
                                <div className="pt-2 border-t">
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Total</span>
                                        <span className="text-purple-600">
                                            {formatCurrency(finalTotal)}
                                        </span>
                                    </div>
                                </div>
                            </>
                        );
                    })()}

                    <button
                        onClick={handleCheckout}
                        disabled={items.length === 0}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-2xl transition-colors shadow-lg"
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </>
    );
}
