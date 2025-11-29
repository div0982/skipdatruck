// Utility functions for storing truckId in browser localStorage
// This is a temporary solution for localhost development

const TRUCK_ID_KEY = 'foodTruckId';

export function saveTruckId(truckId: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TRUCK_ID_KEY, truckId);
    }
}

export function getTruckId(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(TRUCK_ID_KEY);
    }
    return null;
}

export function clearTruckId(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TRUCK_ID_KEY);
    }
}

