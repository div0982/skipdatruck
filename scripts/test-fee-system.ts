/**
 * Test script to run fee simulator and generate report
 * Run with: npx tsx scripts/test-fee-system.ts
 */

import { generateFullReport, runTestCases, formatSimulationTable } from '../lib/fee-simulator';
import { calculateFees, getFeeSummary } from '../lib/fee-calculator';

console.log('🎯 Dynamic Fee System - Comprehensive Testing\n');
console.log('='.repeat(80));
console.log('\n');

// Run full report
console.log(generateFullReport());

console.log('\n');
console.log('='.repeat(80));
console.log('\n📊 Detailed Examples\n');

// Show detailed examples for key order values
const examples = [5, 12, 15, 30, 50];
examples.forEach(amount => {
    console.log(`\n--- $${amount} Order ---`);
    const breakdown = calculateFees(amount);
    console.log(getFeeSummary(breakdown));
});

console.log('\n');
console.log('='.repeat(80));
console.log('\n✅ Test Complete!\n');
