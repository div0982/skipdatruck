// Utility functions
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================
// TIMEZONE CONFIGURATION
// ============================================

/**
 * Application timezone - Eastern Standard Time
 * Uses 'America/Toronto' for proper EST/EDT handling
 */
export const APP_TIMEZONE = 'America/Toronto';

// ============================================
// DATE/TIME FORMATTING FUNCTIONS (EST)
// ============================================

/**
 * Format date in EST timezone
 * @param date - Date object or ISO string
 * @returns Formatted date string (e.g., "December 11, 2025")
 */
export function formatDateEST(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Format time in EST timezone
 * @param date - Date object or ISO string
 * @returns Formatted time string (e.g., "7:30 PM")
 */
export function formatTimeEST(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-CA', {
        timeZone: APP_TIMEZONE,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format date and time in EST timezone
 * @param date - Date object or ISO string
 * @returns Formatted datetime string (e.g., "Dec 11, 2025, 7:30 PM")
 */
export function formatDateTimeEST(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-CA', {
        timeZone: APP_TIMEZONE,
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

/**
 * Format date in short format for tables/lists in EST timezone
 * @param date - Date object or ISO string
 * @returns Formatted date string (e.g., "2025-12-11")
 */
export function formatDateShortEST(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

/**
 * Format date for CSV/exports in EST timezone (YYYY-MM-DD)
 * @param date - Date object or ISO string
 * @returns Formatted date string in ISO format
 */
export function formatDateISOEST(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Get the date parts in EST timezone
    const parts = d.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).split('-');
    return parts.join('-');
}

/**
 * Format month/year for reports in EST timezone
 * @param date - Date object or ISO string
 * @returns Formatted string (e.g., "December 2025")
 */
export function formatMonthYearEST(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: 'long',
    });
}

/**
 * Format short month/day for charts in EST timezone
 * @param date - Date object or ISO string
 * @returns Formatted string (e.g., "Dec 11")
 */
export function formatShortMonthDayEST(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Get hour (0-23) in EST timezone
 * @param date - Date object or ISO string
 * @returns Hour number in EST
 */
export function getHourEST(date: Date | string): number {
    const d = typeof date === 'string' ? new Date(date) : date;
    const hourStr = d.toLocaleString('en-CA', {
        timeZone: APP_TIMEZONE,
        hour: 'numeric',
        hour12: false,
    });
    return parseInt(hourStr, 10);
}

/**
 * Get date string (YYYY-MM-DD) in EST timezone for grouping
 * @param date - Date object or ISO string  
 * @returns Date key string in EST
 */
export function getDateKeyEST(date: Date | string): string {
    return formatDateISOEST(date);
}

/**
 * Get current date/time in EST timezone
 * @returns Current Date object (note: actual Date is still UTC internally)
 */
export function getNowEST(): Date {
    return new Date();
}

/**
 * Get start of day in EST timezone
 * @param date - Optional date (defaults to today)
 * @returns Date object set to start of day in EST
 */
export function getStartOfDayEST(date?: Date | string): Date {
    const d = date ? (typeof date === 'string' ? new Date(date) : new Date(date)) : new Date();
    // Get the date in EST
    const estDateStr = d.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    // Create a new date at midnight EST by appending the offset
    return new Date(`${estDateStr}T00:00:00-05:00`);
}

/**
 * Get end of day in EST timezone  
 * @param date - Optional date (defaults to today)
 * @returns Date object set to end of day in EST
 */
export function getEndOfDayEST(date?: Date | string): Date {
    const d = date ? (typeof date === 'string' ? new Date(date) : new Date(date)) : new Date();
    // Get the date in EST
    const estDateStr = d.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    // Create a new date at end of day EST
    return new Date(`${estDateStr}T23:59:59-05:00`);
}

/**
 * Format hour for display (e.g., "7 PM", "12 AM")
 * @param hour - Hour number (0-23)
 * @returns Formatted hour string
 */
export function formatHourLabel(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
}

// ============================================
// CLASS UTILITIES
// ============================================

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ============================================
// CURRENCY & NUMBER FORMATTING
// ============================================

/**
 * Format currency in CAD
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
    }).format(amount);
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Generate order number
 */
export function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
}

/**
 * Truncate text
 */
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

// ============================================
// LEGACY FUNCTIONS (kept for compatibility)
// ============================================

/**
 * Format date for display (legacy - use formatDateEST instead)
 * @deprecated Use formatDateEST for EST timezone support
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}