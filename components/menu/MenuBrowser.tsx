'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { useCart } from '../cart/CartProvider';

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
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [quantity, setQuantity] = useState(1);
    const { cart, addToCart } = useCart();

    const filteredItems = selectedCategory
        ? menuItems.filter((item) => item.category === selectedCategory)
        : menuItems;

    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleAddToCart = () => {
        if (!selectedItem) return;
        addToCart(selectedItem, quantity);
        setSelectedItem(null);
        setQuantity(1);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Category Filter - Sticky */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg -mx-4 px-4 py-4 mb-6 border-b border-gray-200 shadow-sm">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-6 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${selectedCategory === null
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All Items
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-6 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${selectedCategory === category
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Items Grid - Uber Eats Style */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100 hover:border-purple-200 group"
                    >
                        {/* Image */}
                        <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-6xl">🍔</span>
                                </div>
                            )}
                            {/* Add Button Overlay */}
                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="bg-white rounded-full p-3 shadow-lg hover:bg-purple-50 transition-colors">
                                    <Plus className="w-5 h-5 text-purple-600" />
                                </button>
                            </div>
                        </div>

                        {/* Item Details */}
                        <div className="p-4">
                            <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                                {item.name}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3 min-h-[40px]">
                                {item.description || 'Delicious item from our menu'}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-purple-600">
                                    ${item.price.toFixed(2)}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(item, 1);
                                    }}
                                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-full font-medium text-sm transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Item Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in">
                    <div className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Image */}
                        <div className="relative h-64 bg-gradient-to-br from-purple-100 to-blue-100">
                            {selectedItem.imageUrl ? (
                                <img
                                    src={selectedItem.imageUrl}
                                    alt={selectedItem.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-9xl">🍔</span>
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {selectedItem.name}
                            </h2>
                            <p className="text-gray-600 mb-6">
                                {selectedItem.description || 'Delicious item from our menu'}
                            </p>

                            {/* Quantity Selector */}
                            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-2xl">
                                <span className="font-medium text-gray-700">Quantity</span>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="bg-white rounded-full p-2 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <Minus className="w-5 h-5 text-gray-700" />
                                    </button>
                                    <span className="font-bold text-xl text-gray-900 w-8 text-center">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="bg-white rounded-full p-2 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <Plus className="w-5 h-5 text-gray-700" />
                                    </button>
                                </div>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={handleAddToCart}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5" />
                                    Add to Cart
                                </span>
                                <span>${(selectedItem.price * quantity).toFixed(2)}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
