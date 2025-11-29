// Platform Fee Calculator
// Calculates 4% + $0.10 CAD service fee

/**
 * Calculate platform service fee
 * Formula: (subtotal × 0.04) + 0.10 CAD
 * @param subtotal - Order subtotal in CAD
 * @returns Platform fee rounded to 2 decimals
 */
export function calculatePlatformFee(subtotal: number): number {
    const fee = (subtotal * 0.04) + 0.10;
    return Math.round(fee * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert CAD dollar amount to cents for Stripe
 * @param amount - Amount in CAD dollars
 * @returns Amount in cents
 */
export function toStripeCents(amount: number): number {
    return Math.round(amount * 100);
}

/**
 * Convert Stripe cents to CAD dollars
 * @param cents - Amount in cents
 * @returns Amount in CAD dollars
 */
export function fromStripeCents(cents: number): number {
    return cents / 100;
}

/**
 * Calculate total order amount
 * @param subtotal - Order subtotal
 * @param tax - Tax amount  
 * @param platformFee - Platform fee amount
 * @returns Total amount
 */
export function calculateTotal(subtotal: number, tax: number, platformFee: number): number {
    const total = subtotal + tax + platformFee;
    return Math.round(total * 100) / 100;
}
