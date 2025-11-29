'use client';

// Individual Menu Item Card
import { MenuItem as MenuItemType } from '@prisma/client';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '../cart/CartProvider';

interface MenuItemProps {
    item: MenuItemType;
}

export default function MenuItem({ item }: MenuItemProps) {
    const { addItem } = useCart();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex gap-4 p-4">
                {/* Image */}
                {item.imageUrl ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex-shrink-0" />
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    {item.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {item.description}
                        </p>
                    )}
                    <p className="text-lg font-bold text-purple-600 mt-2">
                        {formatCurrency(item.price)}
                    </p>
                </div>

                {/* Add Button */}
                <button
                    onClick={() => addItem(item)}
                    className="self-center flex-shrink-0 w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg shadow-purple-200"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
