'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Trash2, Plus, Save, X, Loader2 } from 'lucide-react';

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    isAvailable: boolean;
}

export default function MenuEditPage() {
    const router = useRouter();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<MenuItem>>({});
    const [showAddForm, setShowAddForm] = useState(false);

    // Fetch menu items
    useEffect(() => {
        async function fetchMenu() {
            try {
                const response = await fetch('/api/user/truck');
                if (response.ok) {
                    const truck = await response.json();
                    const menuResponse = await fetch(`/api/menu?truckId=${truck.id}`);
                    if (menuResponse.ok) {
                        const items = await menuResponse.json();
                        setMenuItems(items);
                    }
                }
            } catch (error) {
                console.error('Failed to load menu:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchMenu();
    }, []);

    const handleEdit = (item: MenuItem) => {
        setEditingId(item.id);
        setEditForm(item);
    };

    const handleSave = async (id: string) => {
        try {
            const response = await fetch(`/api/menu/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (response.ok) {
                const updated = await response.json();
                setMenuItems(menuItems.map(item => item.id === id ? updated : item));
                setEditingId(null);
                setEditForm({});
            }
        } catch (error) {
            console.error('Failed to update item:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const response = await fetch(`/api/menu/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setMenuItems(menuItems.filter(item => item.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    const handleAdd = async () => {
        try {
            const truckResponse = await fetch('/api/user/truck');
            const truck = await truckResponse.json();

            const response = await fetch('/api/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editForm,
                    truckId: truck.id,
                }),
            });

            if (response.ok) {
                const newItem = await response.json();
                setMenuItems([...menuItems, newItem]);
                setShowAddForm(false);
                setEditForm({});
            }
        } catch (error) {
            console.error('Failed to add item:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Menu</h1>
                            <p className="text-sm text-gray-600">Manage your menu items</p>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/merchant')}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Add New Item Button */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Item
                    </button>
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                        <h3 className="font-bold text-lg mb-4">Add New Menu Item</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input
                                type="text"
                                placeholder="Item Name"
                                value={editForm.name || ''}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="px-4 py-2 border rounded-lg"
                            />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Price"
                                value={editForm.price || ''}
                                onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                className="px-4 py-2 border rounded-lg"
                            />
                            <input
                                type="text"
                                placeholder="Category"
                                value={editForm.category || ''}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                className="px-4 py-2 border rounded-lg"
                            />
                        </div>
                        <textarea
                            placeholder="Description"
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg mb-4"
                            rows={3}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAdd}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Add Item
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditForm({});
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Menu Items Grid */}
                <div className="grid gap-4">
                    {menuItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl p-6 border border-gray-200">
                            {editingId === item.id ? (
                                // Edit Mode
                                <div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <input
                                            type="text"
                                            value={editForm.name || ''}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="px-4 py-2 border rounded-lg font-bold"
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editForm.price || ''}
                                            onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                            className="px-4 py-2 border rounded-lg"
                                        />
                                        <input
                                            type="text"
                                            value={editForm.category || ''}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            className="px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <textarea
                                        value={editForm.description || ''}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg mb-4"
                                        rows={3}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSave(item.id)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditForm({});
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // View Mode
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-2">
                                            <h3 className="font-bold text-lg">{item.name}</h3>
                                            <span className="text-lg font-semibold text-purple-600">
                                                ${item.price.toFixed(2)}
                                            </span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                {item.category}
                                            </span>
                                        </div>
                                        <p className="text-gray-600">{item.description}</p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {menuItems.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No menu items yet. Add your first item!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
