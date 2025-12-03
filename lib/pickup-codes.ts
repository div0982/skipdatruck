// Pickup Code Generation Utilities
// Generates cryptographically random 4-digit codes for order pickup verification

import { randomInt } from 'crypto';

/**
 * Generate a cryptographically random 4-digit pickup code
 * @returns String representation of 4-digit code (e.g., "0427")
 */
export function generatePickupCode(): string {
    // Generate random number between 0 and 9999
    const code = randomInt(0, 10000);
    // Pad with zeros to ensure 4 digits
    return code.toString().padStart(4, '0');
}

/**
 * Validate pickup code format
 * @param code - The code to validate
 * @returns true if code is valid 4-digit string
 */
export function validatePickupCodeFormat(code: string): boolean {
    return /^\d{4}$/.test(code);
}
