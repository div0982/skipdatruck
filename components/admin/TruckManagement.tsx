'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface TruckData {
    truckId: string;
    truckName: string;
    ownerName: string | null;
    ownerEmail: string;
    province: string;
    totalOrders: number;
    totalRevenue: number;
    totalPlatformFees: number;
    isActive: boolean;
    stripeOnboarded: boolean;
}

interface TruckManagementProps {
    trucks: TruckData[];
}

export default function TruckManagement({ trucks }: TruckManagementProps) {
    const [deletingTruck, setDeletingTruck] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedTruck, setSelectedTruck] = useState<TruckData | null>(null);
    const [deleteStatus, setDeleteStatus] = useState<{ success?: string; error?: string }>({});

    const handleDeleteClick = (truck: TruckData) => {
        setSelectedTruck(truck);
        setShowDeleteModal(true);
        setDeleteStatus({});
    };

    const handleConfirmDelete = async () => {
        if (!selectedTruck) return;

        setDeletingTruck(selectedTruck.truckId);
        setDeleteStatus({});

        try {
            const response = await fetch(`/api/admin/trucks/${selectedTruck.truckId}/delete`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete truck');
            }

            setDeleteStatus({ success: data.message });

            // Refresh the page after 1.5 seconds
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error: any) {
            console.error('Delete failed:', error);
            setDeleteStatus({ error: error.message || 'Failed to delete truck' });
        } finally {
            setDeletingTruck(null);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setSelectedTruck(null);
        setDeleteStatus({});
    };

    return (
        <>
            <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Truck Management</h2>
                <p className="text-sm text-gray-600 mb-6">
                    Manage all food trucks on the platform. Delete trucks to remove all their data including orders, menu items, and earnings.
                </p>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b text-left text-sm text-gray-600">
                                <th className="pb-3 pr-4">Truck Name</th>
                                <th className="pb-3 pr-4">Owner</th>
                                <th className="pb-3 pr-4">Province</th>
                                <th className="pb-3 pr-4 text-right">Orders</th>
                                <th className="pb-3 pr-4 text-right">Revenue</th>
                                <th className="pb-3 pr-4">Status</th>
                                <th className="pb-3"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {trucks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-gray-500">
                                        No trucks found
                                    </td>
                                </tr>
                            ) : (
                                trucks.map((truck) => (
                                    <tr key={truck.truckId} className="border-b hover:bg-gray-50">
                                        <td className="py-4 pr-4 font-medium text-gray-900">
                                            {truck.truckName}
                                        </td>
                                        <td className="py-4 pr-4">
                                            <div>
                                                <div className="text-gray-900">{truck.ownerName || 'No name'}</div>
                                                <div className="text-xs text-gray-500">{truck.ownerEmail}</div>
                                            </div>
                                        </td>
                                        <td className="py-4 pr-4 text-gray-700">{truck.province}</td>
                                        <td className="py-4 pr-4 text-right text-gray-700">{truck.totalOrders}</td>
                                        <td className="py-4 pr-4 text-right font-medium text-gray-900">
                                            {formatCurrency(truck.totalRevenue)}
                                        </td>
                                        <td className="py-4 pr-4">
                                            <div className="flex flex-col gap-1">
                                                {truck.isActive ? (
                                                    <span className="text-xs text-green-600">Active</span>
                                                ) : (
                                                    <span className="text-xs text-gray-500">Inactive</span>
                                                )}
                                                {truck.stripeOnboarded ? (
                                                    <span className="text-xs text-blue-600">Stripe ✓</span>
                                                ) : (
                                                    <span className="text-xs text-yellow-600">No Stripe</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteClick(truck)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-700 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedTruck && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    Delete Truck Account?
                                </h3>
                                <p className="text-sm text-gray-600">
                                    This will permanently delete <strong>{selectedTruck.truckName}</strong> and ALL related data:
                                </p>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <ul className="text-sm text-red-900 space-y-2">
                                <li>• {selectedTruck.totalOrders} orders will be deleted</li>
                                <li>• All menu items will be removed</li>
                                <li>• {formatCurrency(selectedTruck.totalRevenue)} in revenue history will be lost</li>
                                <li>• The truck account cannot be recovered</li>
                            </ul>
                        </div>

                        {deleteStatus.error && (
                            <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
                                <p className="text-sm text-red-800">{deleteStatus.error}</p>
                            </div>
                        )}

                        {deleteStatus.success && (
                            <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
                                <p className="text-sm text-green-800">{deleteStatus.success}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelDelete}
                                disabled={!!deletingTruck}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={!!deletingTruck}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                            >
                                {deletingTruck ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
