'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    imageUrl: string | null;
}

interface CartItem extends MenuItem {
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
    items: CartItem[];
    addItem: (item: MenuItem) => void;
    addToCart: (item: MenuItem, quantity: number) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
}

interface CartProviderProps {
    children: ReactNode;
    truck: {
        id: string;
        name: string;
        province: any;
        taxRate: number;
    };
}

export default function CartProvider({ children, truck }: CartProviderProps) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const openCart = () => setIsOpen(true);
    const closeCart = () => setIsOpen(false);

    const addItem = (item: MenuItem) => {
        setItems((current) => {
            const existing = current.find((i) => i.id === item.id);
            if (existing) {
                return current.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...current, { ...item, quantity: 1 }];
        });
    };

    const addToCart = (item: MenuItem, quantity: number) => {
        setItems((current) => {
            const existing = current.find((i) => i.id === item.id);
            if (existing) {
                return current.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
                );
            }
            return [...current, { ...item, quantity }];
        });
    };

    const removeItem = (itemId: string) => {
        setItems((current) => current.filter((i) => i.id !== itemId));
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(itemId);
            return;
        }
        setItems((current) =>
            current.map((i) => (i.id === itemId ? { ...i, quantity } : i))
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cart: items,
                items,
                addItem,
                addToCart,
                removeItem,
                updateQuantity,
                clearCart,
                total,
                itemCount,
                isOpen,
                openCart,
                closeCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}
