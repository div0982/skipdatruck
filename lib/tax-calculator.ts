// Canadian Tax Calculator
// Calculates GST/HST/PST based on province

import { Province } from '@prisma/client';

export const PROVINCIAL_TAX_RATES: Record<Province, number> = {
    AB: 0.05,      // Alberta - 5% GST
    BC: 0.12,      // British Columbia - 5% GST + 7% PST
    MB: 0.12,      // Manitoba - 5% GST + 7% PST  
    NB: 0.15,      // New Brunswick - 15% HST
    NL: 0.15,      // Newfoundland - 15% HST
    NT: 0.05,      // Northwest Territories - 5% GST
    NS: 0.15,      // Nova Scotia - 15% HST
    NU: 0.05,      // Nunavut - 5% GST
    ON: 0.13,      // Ontario - 13% HST
    PE: 0.15,      // Prince Edward Island - 15% HST
    QC: 0.14975,   // Quebec - 5% GST + 9.975% QST
    SK: 0.11,      // Saskatchewan - 5% GST + 6% PST
    YT: 0.05,      // Yukon - 5% GST
};

/**
 * Calculate tax for a given subtotal and province
 * @param subtotal - Order subtotal in CAD
 * @param province - Canadian province code
 * @returns Tax amount rounded to 2 decimals
 */
export function calculateTax(subtotal: number, province: Province): number {
    const taxRate = PROVINCIAL_TAX_RATES[province];
    const tax = subtotal * taxRate;
    return Math.round(tax * 100) / 100; // Round to 2 decimal places
}

/**
 * Get tax rate for a province
 */
export function getTaxRate(province: Province): number {
    return PROVINCIAL_TAX_RATES[province];
}

/**
 * Get tax label for display (GST, HST, etc.)
 */
export function getTaxLabel(province: Province): string {
    const hstProvinces: Province[] = ['NB', 'NL', 'NS', 'ON', 'PE'];
    const pstProvinces: Province[] = ['BC', 'MB', 'SK'];
    const qstProvinces: Province[] = ['QC'];

    if (hstProvinces.includes(province)) {
        return 'HST';
    } else if (qstProvinces.includes(province)) {
        return 'GST + QST';
    } else if (pstProvinces.includes(province)) {
        return 'GST + PST';
    }
    return 'GST';
}
