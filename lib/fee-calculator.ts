/**
 * Dynamic Fee Calculator for Food Truck Ordering Platform
 * 
 * Supports TWO business models:
 * 
 * 1. PLATFORM_PAYS_FEES: Platform absorbs Stripe costs
 *    - Uses dynamic 3-tier system (higher fees)
 *    - Guarantees platform profit of $0.05+ per order
 *    - Platform handles all payment processing
 * 
 * 2. MERCHANT_PAYS_FEES: Merchant absorbs Stripe costs
 *    - Simple 3% flat commission on subtotal
 *    - Merchant pays Stripe directly
 *    - Platform just collects commission
 */

/**
 * Business model determines who pays Stripe fees
 */
export enum BusinessModel {
    PLATFORM_PAYS_FEES = 'PLATFORM_PAYS_FEES',  // Complex tier system
    MERCHANT_PAYS_FEES = 'MERCHANT_PAYS_FEES',  // Simple 3% commission
    HYBRID = 'HYBRID',  // Platform pays fees + 1% application fee from merchant
}

export interface FeeBreakdown {
    subtotal: number;
    platformFee: number;
    taxAmount: number;
    totalPayment: number;
    stripeFee: number;
    platformProfit: number;
    businessModel: BusinessModel;
    tier: 1 | 2 | 3 | null; // null for MERCHANT_PAYS_FEES mode
    tierDescription: string;
    feePercentage: number; // Fee as % of subtotal
}

export interface FeeTier {
    minAmount: number;
    maxAmount: number | null;
    fixedFee: number;
    percentageFee: number;
    description: string;
}

// Stripe fee constants (Canadian rates)
const STRIPE_PERCENTAGE = 0.029; // 2.9%
const STRIPE_FIXED_FEE = 0.30; // $0.30 CAD

// Minimum profit guarantee (for PLATFORM_PAYS_FEES mode)
const MIN_PROFIT = 0.05; // $0.05 CAD

// Simple commission rate (for MERCHANT_PAYS_FEES mode)
const MERCHANT_PAYS_COMMISSION = 0.03; // 3%

// Fee tier structure (optimized version for PLATFORM_PAYS_FEES mode)
export const FEE_TIERS: FeeTier[] = [
    {
        minAmount: 0,
        maxAmount: 8.99,
        fixedFee: 0.65,
        percentageFee: 0.035, // 3.5%
        description: 'Small orders ($1-$8.99)',
    },
    {
        minAmount: 9.00,
        maxAmount: 24.99,
        fixedFee: 0.40,
        percentageFee: 0.039, // 3.9%
        description: 'Medium orders ($9-$24.99)',
    },
    {
        minAmount: 25.00,
        maxAmount: null,
        fixedFee: 0.05,
        percentageFee: 0.040, // 4.0%
        description: 'Large orders ($25+)',
    },
];

/**
 * Determines which fee tier applies to the given subtotal
 */
function getTierForAmount(subtotal: number): FeeTier {
    for (const tier of FEE_TIERS) {
        if (subtotal >= tier.minAmount && (tier.maxAmount === null || subtotal <= tier.maxAmount)) {
            return tier;
        }
    }
    return FEE_TIERS[0];
}

/**
 * Calculates the platform fee based on the subtotal (PLATFORM_PAYS_FEES mode)
 */
function calculatePlatformFeeTiered(subtotal: number): number {
    const tier = getTierForAmount(subtotal);
    const fee = tier.fixedFee + (subtotal * tier.percentageFee);
    return Math.round(fee * 100) / 100;
}

/**
 * Calculates simple 3% commission (MERCHANT_PAYS_FEES mode)
 */
function calculatePlatformFeeFlat(subtotal: number): number {
    const fee = subtotal * MERCHANT_PAYS_COMMISSION;
    return Math.round(fee * 100) / 100;
}

/**
 * Calculates the platform fee based on business model
 */
export function calculatePlatformFee(subtotal: number, businessModel: BusinessModel = BusinessModel.PLATFORM_PAYS_FEES): number {
    if (businessModel === BusinessModel.MERCHANT_PAYS_FEES) {
        return calculatePlatformFeeFlat(subtotal);
    }
    return calculatePlatformFeeTiered(subtotal);
}

/**
 * Calculates Stripe's processing fee on the total payment
 */
function calculateStripeFee(totalPayment: number): number {
    const fee = (totalPayment * STRIPE_PERCENTAGE) + STRIPE_FIXED_FEE;
    return Math.round(fee * 100) / 100;
}

/**
 * Calculates tax on the subtotal
 */
export function calculateTax(subtotal: number, taxRate: number): number {
    const tax = subtotal * taxRate;
    return Math.round(tax * 100) / 100;
}

/**
 * Main fee calculation function with complete breakdown
 * 
 * @param subtotal - Order subtotal (before tax and fees)
 * @param taxRate - Tax rate as decimal (e.g., 0.13 for 13% HST)
 * @param businessModel - Which business model to use
 * @returns Complete fee breakdown including all calculations
 */
export function calculateFees(
    subtotal: number,
    taxRate: number = 0.13,
    businessModel: BusinessModel = BusinessModel.PLATFORM_PAYS_FEES
): FeeBreakdown {
    // Validate inputs
    if (subtotal <= 0) {
        throw new Error('Subtotal must be greater than 0');
    }
    if (taxRate < 0 || taxRate > 1) {
        throw new Error('Tax rate must be between 0 and 1');
    }

    // Calculate platform fee based on business model
    let platformFee = calculatePlatformFee(subtotal, businessModel);

    // Calculate tax (on subtotal only)
    const taxAmount = calculateTax(subtotal, taxRate);

    let totalPayment: number;
    let stripeFee: number;
    let platformProfit: number;
    let tier: 1 | 2 | 3 | null;
    let tierDescription: string;

    if (businessModel === BusinessModel.MERCHANT_PAYS_FEES) {
        // MERCHANT_PAYS_FEES mode: Simple logic
        // Merchant pays Stripe, we just take 3% commission
        totalPayment = subtotal + taxAmount + platformFee;
        stripeFee = 0; // Merchant pays this, not us
        platformProfit = platformFee; // Full commission is our profit
        tier = null;
        tierDescription = 'Merchant pays Stripe fees (3% commission)';
    } else {
        // PLATFORM_PAYS_FEES or HYBRID mode: Complex tier logic
        // (HYBRID adds additional 1% application fee in payment processing)
        totalPayment = subtotal + taxAmount + platformFee;
        stripeFee = calculateStripeFee(totalPayment);
        platformProfit = platformFee - stripeFee;

        // Safety guard - ensure minimum profit
        if (platformProfit < MIN_PROFIT) {
            const shortfall = MIN_PROFIT - platformProfit;
            platformFee += shortfall;
            totalPayment += shortfall;
            platformProfit = MIN_PROFIT;
        }

        const tierData = getTierForAmount(subtotal);
        tier = FEE_TIERS.indexOf(tierData) + 1 as 1 | 2 | 3;
        tierDescription = tierData.description;
    }

    const feePercentage = (platformFee / subtotal) * 100;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        platformFee: Math.round(platformFee * 100) / 100,
        taxAmount,
        totalPayment: Math.round(totalPayment * 100) / 100,
        stripeFee,
        platformProfit: Math.round(platformProfit * 100) / 100,
        businessModel,
        tier,
        tierDescription,
        feePercentage: Math.round(feePercentage * 100) / 100,
    };
}

/**
 * Validates that the fee calculation meets profit requirements
 */
export function validateProfitMargin(breakdown: FeeBreakdown): boolean {
    if (breakdown.businessModel === BusinessModel.MERCHANT_PAYS_FEES) {
        return breakdown.platformProfit > 0;
    }
    return breakdown.platformProfit >= MIN_PROFIT;
}

/**
 * Formats currency values for display
 */
export function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)} CAD`;
}

/**
 * Gets a human-readable summary of the fee breakdown
 */
export function getFeeSummary(breakdown: FeeBreakdown): string {
    const baseInfo = `
Order Subtotal: ${formatCurrency(breakdown.subtotal)}
Platform Fee (${breakdown.tierDescription}): ${formatCurrency(breakdown.platformFee)} (${breakdown.feePercentage.toFixed(1)}%)
Tax (HST): ${formatCurrency(breakdown.taxAmount)}
Total Payment: ${formatCurrency(breakdown.totalPayment)}`;

    if (breakdown.businessModel === BusinessModel.MERCHANT_PAYS_FEES) {
        return `${baseInfo}

--- Platform Breakdown ---
Business Model: Merchant Pays Stripe Fees
Platform Commission: ${formatCurrency(breakdown.platformProfit)} (3% of subtotal)
Profit Status: ✅ PASS`;
    }

    return `${baseInfo}

--- Platform Breakdown ---
Business Model: Platform Pays Stripe Fees
Stripe Processing Fee: ${formatCurrency(breakdown.stripeFee)}
Platform Profit: ${formatCurrency(breakdown.platformProfit)}
Profit Status: ${validateProfitMargin(breakdown) ? '✅ PASS' : '❌ FAIL'}`;
}

// Legacy compatibility functions
export function toStripeCents(amount: number): number {
    return Math.round(amount * 100);
}

export function fromStripeCents(cents: number): number {
    return cents / 100;
}

export function calculateTotal(subtotal: number, tax: number, platformFee: number): number {
    const total = subtotal + tax + platformFee;
    return Math.round(total * 100) / 100;
}

export function calculateMerchantPayout(subtotal: number, tax: number): number {
    const stripeFee = calculateStripeFee(subtotal + tax);
    const payout = (subtotal + tax) - stripeFee;
    return Math.round(payout * 100) / 100;
}
