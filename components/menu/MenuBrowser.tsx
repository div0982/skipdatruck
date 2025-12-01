'use client';

import { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { useCart } from '../cart/CartProvider';
import { formatCurrency } from '@/lib/utils';

interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    imageUrl: string | null;
}

interface MenuBrowserProps {
    menuItems: MenuItem[];
    categories: string[];
    truckId: string;
}

export default function MenuBrowser({ menuItems, categories, truckId }: MenuBrowserProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const { addToCart, items: cartItems, updateQuantity, removeItem } = useCart();

    const filteredItems = selectedCategory
        ? menuItems.filter((item) => item.category === selectedCategory)
        : menuItems;

    // Group items by category for better organization
    const groupedItems = filteredItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);

    const getItemQuantity = (itemId: string) => {
        const cartItem = cartItems.find(item => item.id === itemId);
        return cartItem?.quantity || 0;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Category Filter - Clean and Simple */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 -mx-4 px-4 py-3 mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-5 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                            selectedCategory === null
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-5 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                                selectedCategory === category
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Items - Clean List View */}
            <div className="space-y-8">
                {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category}>
                        {/* Category Header */}
                        <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                            {category}
                        </h2>

                        {/* Items List */}
                        <div className="space-y-3">
                            {items.map((item) => {
                                const quantity = getItemQuantity(item.id);
                                
                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Item Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                    {item.name}
                                                </h3>
                                                {item.description && (
                                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-3">
                                                    <span className="text-xl font-bold text-purple-600">
                                                        {formatCurrency(item.price)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                {quantity > 0 ? (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                if (quantity === 1) {
                                                                    removeItem(item.id);
                                                                } else {
                                                                    updateQuantity(item.id, quantity - 1);
                                                                }
                                                            }}
                                                            className="w-10 h-10 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 flex items-center justify-center transition-colors"
                                                        >
                                                            <Minus className="w-5 h-5" />
                                                        </button>
                                                        <span className="text-lg font-bold text-gray-900 w-8 text-center">
                                                            {quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => addToCart(item, 1)}
                                                            className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-colors shadow-md"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => addToCart(item, 1)}
                                                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center gap-2"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                        <span>Add</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No items found in this category</p>
                </div>
            )}
        </div>
    );
}
