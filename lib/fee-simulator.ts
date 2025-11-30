/**
    const results: SimulationResult[] = [];

    for (let subtotal = start; subtotal <= end; subtotal += step) {
        const breakdown = calculateFees(subtotal);
        results.push({
            subtotal: breakdown.subtotal,
            myFee: breakdown.platformFee,
            stripeCost: breakdown.stripeFee,
            netProfit: breakdown.platformProfit,
            feePercentage: breakdown.feePercentage,
            tier: breakdown.tier,
            passed: validateProfitMargin(breakdown),
        });
    }

    return results;
}

/**
 * Runs simulation for all test cases
 */
export function runTestCases(): SimulationResult[] {
    const testValues = [1, 3, 5, 9, 10, 12, 15, 18, 20, 25, 30, 40, 50];
    return testValues.map(subtotal => {
        const breakdown = calculateFees(subtotal);
        return {
            subtotal: breakdown.subtotal,
            myFee: breakdown.platformFee,
            stripeCost: breakdown.stripeFee,
            netProfit: breakdown.platformProfit,
            feePercentage: breakdown.feePercentage,
            tier: breakdown.tier,
            passed: validateProfitMargin(breakdown),
        };
    });
}

/**
 * Generates a formatted table for simulation results
 */
export function formatSimulationTable(results: SimulationResult[]): string {
    let table = '| Subtotal | My Fee | Stripe Cost | Net Profit | Fee % | Tier | Status |\n';
    table += '|----------|--------|-------------|------------|-------|------|--------|\n';

    for (const result of results) {
        table += `| ${formatCurrency(result.subtotal)} | ${formatCurrency(result.myFee)} | ${formatCurrency(result.stripeCost)} | ${formatCurrency(result.netProfit)} | ${result.feePercentage.toFixed(1)}% | ${result.tier} | ${result.passed ? '✅ PASS' : '❌ FAIL'} |\n`;
    }

    return table;
}

/**
 * Generates statistics from simulation results
 */
export function generateStatistics(results: SimulationResult[]): {
    totalOrders: number;
    passedOrders: number;
    failedOrders: number;
    avgProfit: number;
    minProfit: number;
    maxProfit: number;
    avgFeePercentage: number;
} {
    const totalOrders = results.length;
    const passedOrders = results.filter(r => r.passed).length;
    const failedOrders = totalOrders - passedOrders;

    const profits = results.map(r => r.netProfit);
    const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
    const minProfit = Math.min(...profits);
    const maxProfit = Math.max(...profits);

    const feePercentages = results.map(r => r.feePercentage);
    const avgFeePercentage = feePercentages.reduce((a, b) => a + b, 0) / feePercentages.length;

    return {
        totalOrders,
        passedOrders,
        failedOrders,
        avgProfit,
        minProfit,
        maxProfit,
        avgFeePercentage,
    };
}

/**
 * Generates a complete report with all simulations
 */
export function generateFullReport(): string {
    let report = '# Dynamic Fee System - Complete Profit Analysis\n\n';

    report += '## Test Cases ($1, $3, $5, $9, $10, $12, $15, $18, $20, $25, $30, $40, $50)\n\n';
    const testCases = runTestCases();
    report += formatSimulationTable(testCases);
    report += '\n';

    report += '## Full Range Simulation ($1 to $50)\n\n';
    const fullRange = simulateFeeRange(1, 50, 1);
    const stats = generateStatistics(fullRange);

    report += `**Statistics:**\n`;
    report += `- Total Orders Tested: ${stats.totalOrders}\n`;
    report += `- Passed (≥ $0.05 profit): ${stats.passedOrders}\n`;
    report += `- Failed: ${stats.failedOrders}\n`;
    report += `- Average Profit: ${formatCurrency(stats.avgProfit)}\n`;
    report += `- Minimum Profit: ${formatCurrency(stats.minProfit)}\n`;
    report += `- Maximum Profit: ${formatCurrency(stats.maxProfit)}\n`;
    report += `- Average Fee %: ${stats.avgFeePercentage.toFixed(2)}%\n\n`;

    // Detailed breakdown by tier
    report += '## Tier Performance Analysis\n\n';

    const tier1 = fullRange.filter(r => r.tier === 1);
    const tier2 = fullRange.filter(r => r.tier === 2);
    const tier3 = fullRange.filter(r => r.tier === 3);

    report += '### Tier 1: Small Orders ($1-$8.99)\n';
    report += `- Formula: $0.65 + 3.5%\n`;
    report += `- Orders: ${tier1.length}\n`;
    report += `- Avg Profit: ${formatCurrency(tier1.reduce((sum, r) => sum + r.netProfit, 0) / tier1.length)}\n`;
    report += `- Avg Fee %: ${(tier1.reduce((sum, r) => sum + r.feePercentage, 0) / tier1.length).toFixed(2)}%\n\n`;

    report += '### Tier 2: Medium Orders ($9-$24.99)\n';
    report += `- Formula: $0.40 + 3.9%\n`;
    report += `- Orders: ${tier2.length}\n`;
    report += `- Avg Profit: ${formatCurrency(tier2.reduce((sum, r) => sum + r.netProfit, 0) / tier2.length)}\n`;
    report += `- Avg Fee %: ${(tier2.reduce((sum, r) => sum + r.feePercentage, 0) / tier2.length).toFixed(2)}%\n\n`;

    report += '### Tier 3: Large Orders ($25+)\n';
    report += `- Formula: $0.05 + 4.0%\n`;
    report += `- Orders: ${tier3.length}\n`;
    report += `- Avg Profit: ${formatCurrency(tier3.reduce((sum, r) => sum + r.netProfit, 0) / tier3.length)}\n`;
    report += `- Avg Fee %: ${(tier3.reduce((sum, r) => sum + r.feePercentage, 0) / tier3.length).toFixed(2)}%\n\n`;

    return report;
}

// Run simulation if executed directly
if (require.main === module) {
    console.log(generateFullReport());
}
