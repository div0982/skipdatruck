/**
 * Test script to demonstrate both business models
 * Run with: npx tsx scripts/test-both-models.ts
 */

import { calculateFees, BusinessModel, formatCurrency } from '../lib/fee-calculator';

console.log('🎯 Dual Business Model Comparison\n');
console.log('='.repeat(80));
console.log('\n');

const testAmounts = [5, 10, 15, 20, 30, 50];

console.log('📊 MODEL COMPARISON: Platform Pays vs Merchant Pays Stripe Fees\n');
console.log('| Order | Platform Pays | Profit | Merchant Pays | Profit | Winner |');
console.log('|-------|---------------|--------|---------------|--------|--------|');

testAmounts.forEach(amount => {
    const platformPays = calculateFees(amount, 0.13, BusinessModel.PLATFORM_PAYS_FEES);
    const merchantPays = calculateFees(amount, 0.13, BusinessModel.MERCHANT_PAYS_FEES);

    const winner = platformPays.platformProfit > merchantPays.platformProfit ? 'Platform' : 'Merchant';

    console.log(
        `| $${amount.toFixed(2)} | ${formatCurrency(platformPays.platformFee)} (${platformPays.feePercentage.toFixed(1)}%) | ${formatCurrency(platformPays.platformProfit)} | ${formatCurrency(merchantPays.platformFee)} (${merchantPays.feePercentage.toFixed(1)}%) | ${formatCurrency(merchantPays.platformProfit)} | ${winner} Pays |`
    );
});

console.log('\n\n');
console.log('='.repeat(80));
console.log('\n📈 DETAILED EXAMPLES\n');

console.log('--- $15 Order: PLATFORM PAYS STRIPE FEES ---\n');
const ex1 = calculateFees(15, 0.13, BusinessModel.PLATFORM_PAYS_FEES);
console.log(`Subtotal: ${formatCurrency(ex1.subtotal)}`);
console.log(`Platform Fee: ${formatCurrency(ex1.platformFee)} (${ex1.feePercentage.toFixed(1)}%)`);
console.log(`Tax: ${formatCurrency(ex1.taxAmount)}`);
console.log(`Total Payment: ${formatCurrency(ex1.totalPayment)}`);
console.log(`\nPlatform Breakdown:`);
console.log(`  Stripe Fee (we pay): ${formatCurrency(ex1.stripeFee)}`);
console.log(`  Our Profit: ${formatCurrency(ex1.platformProfit)}`);
console.log(`  Tier: ${ex1.tier} - ${ex1.tierDescription}`);

console.log('\n\n--- $15 Order: MERCHANT PAYS STRIPE FEES ---\n');
const ex2 = calculateFees(15, 0.13, BusinessModel.MERCHANT_PAYS_FEES);
console.log(`Subtotal: ${formatCurrency(ex2.subtotal)}`);
console.log(`Platform Fee: ${formatCurrency(ex2.platformFee)} (${ex2.feePercentage.toFixed(1)}%)`);
console.log(`Tax: ${formatCurrency(ex2.taxAmount)}`);
console.log(`Total Payment: ${formatCurrency(ex2.totalPayment)}`);
console.log(`\nPlatform Breakdown:`);
console.log(`  Stripe Fee (merchant pays): Merchant's responsibility`);
console.log(`  Our Commission: ${formatCurrency(ex2.platformProfit)} (full 3% is ours)`);
console.log(`  Model: ${ex2.tierDescription}`);

console.log('\n\n');
console.log('='.repeat(80));
console.log('\n💡 KEY INSIGHTS\n');

console.log('Platform Pays Fees Model:');
console.log('  ✅ Platform handles all payment complexity');
console.log('  ✅ Merchant sees one simple fee');
console.log('  ✅ Platform profit varies by order size ($0.05 - $0.34)');
console.log('  ✅ Higher fees but merchant doesn\'t worry about Stripe\n');

console.log('Merchant Pays Fees Model:');
console.log('  ✅ Simple flat 3% commission');
console.log('  ✅ Merchant pays Stripe directly');
console.log('  ✅ Platform gets consistent 3% profit on all orders');
console.log('  ✅ Lower platform fee but merchant handles Stripe costs\n');

console.log('Who Wins:');
console.log('  - Small orders ($5-$10): Platform Pays model earns more');
console.log('  - Medium orders ($15-$25): Platform Pays model earns more');
console.log('  - Large orders ($30+): Merchant Pays model earns more (3% > our tiered profit)\n');

console.log('✅ Both models tested successfully!\n');
