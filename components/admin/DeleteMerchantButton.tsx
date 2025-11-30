'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteMerchantButtonProps {
    userId: string;
    userName: string;
    userEmail: string;
}

export default function DeleteMerchantButton({ userId, userName, userEmail }: DeleteMerchantButtonProps) {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/merchants/${userId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Failed to delete merchant');
                setLoading(false);
                return;
            }

            alert(`✅ Successfully deleted merchant: ${userEmail}`);
            setShowConfirm(false);
            router.refresh(); // Refresh the page to show updated list
        } catch (error) {
            alert('Error deleting merchant');
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete merchant"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Merchant Account?</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to delete <strong>{userName || userEmail}</strong>?
                            This will permanently delete:
                        </p>
                        <ul className="text-sm text-gray-600 mb-6 list-disc list-inside space-y-1">
                            <li>The merchant account</li>
                            <li>All their food trucks</li>
                            <li>All menu items</li>
                            <li>Order history</li>
                        </ul>
                        <p className="text-sm font-semibold text-red-600 mb-6">
                            ⚠️ This action cannot be undone!
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={loading}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
