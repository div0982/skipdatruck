// Stripe Payment Intent API
// Creates payment with platform fee for Stripe Connect

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { calculateTax } from '@/lib/tax-calculator';
import {
    calculateFees,
    BusinessModel,
    toStripeCents,
} from '@/lib/fee-calculator';
import { generateOrderNumber } from '@/lib/utils';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { truckId, items, customerInfo } = body;

        // Validate request
        if (!truckId || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get truck details
        const truck = await prisma.foodTruck.findUnique({
            where: { id: truckId },
            include: {
                owner: {
                    select: {
                        id: true,
                        stripeConnectId: true,
                        stripeOnboarded: true,
                        businessModel: true,
                    }
                }
            },
        });

        if (!truck) {
            return NextResponse.json(
                { error: 'Food truck not found' },
                { status: 404 }
            );
        }

        const useStripeConnect = truck.owner.stripeConnectId && truck.owner.stripeOnboarded;

        // Calculate subtotal
        const subtotal = items.reduce((sum: number, item: any) => {
            return sum + (item.price * item.quantity);
        }, 0);

        const taxRate = truck.taxRate;

        const businessModel = (truck.owner.businessModel || 'MERCHANT_PAYS_FEES') as BusinessModel;

        const feeBreakdown = calculateFees(subtotal, taxRate, businessModel);

        const {
            platformFee,
            taxAmount: tax,
            totalPayment: total,
            stripeFee,
            platformProfit,
            feePercentage,
            merchantApplicationFee
        } = feeBreakdown;

        // Calculate merchant payout based on business model
        let merchantPayout: number;
        if (businessModel === BusinessModel.MERCHANT_PAYS_FEES) {
            // Merchant pays Stripe fees via direct charge
            // They receive subtotal + tax, then Stripe takes ~2.9% + $0.30 from that
            merchantPayout = subtotal + tax; // Stripe fees deducted by Stripe, not us
        } else if (businessModel === BusinessModel.HYBRID) {
            // Platform pays Stripe fees, Merchant pays 1% application fee
            merchantPayout = subtotal + tax - merchantApplicationFee;
        } else {
            // PLATFORM_PAYS_FEES: Platform absorbs Stripe fees
            merchantPayout = subtotal + tax;
        }

        console.log('Payment breakdown:', {
            businessModel,
            subtotal,
            tax,
            platformFee,
            stripeFee,
            merchantPayout,
            platformProfit,
            total
        });

        const orderNumber = generateOrderNumber();

        const minimalItems = items.map((item: any) => ({
            id: item.menuItemId || item.id,
            qty: item.quantity,
            price: item.price.toFixed(2),
            name: item.name && item.name.length <= 50 ? item.name.substring(0, 50) : '',
        }));

        const itemsJson = JSON.stringify(minimalItems);
        const metadata: Record<string, string> = {
            orderNumber,
            truckId,
            truckName: truck.name.substring(0, 100),
            businessModel,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            platformFee: platformFee.toFixed(2),
            stripeFee: stripeFee.toFixed(2),
            platformProfit: platformProfit.toFixed(2),
            merchantPayout: merchantPayout.toFixed(2),
            customerName: (customerInfo?.name || '').substring(0, 100),
            customerEmail: (customerInfo?.email || '').substring(0, 100),
            customerPhone: (customerInfo?.phone || '').substring(0, 20),
            userId: (customerInfo?.userId || '').substring(0, 100),
        };

        if (itemsJson.length <= 450) {
            metadata.items = itemsJson;
        } else {
            metadata.itemCount = minimalItems.length.toString();
            let chunkIndex = 0;
            let currentChunk = '';
            minimalItems.forEach((item: { id: string; qty: number; price: string; name: string }) => {
                const itemStr = JSON.stringify(item);
                if (currentChunk.length + itemStr.length + 1 > 450) {
                    metadata[`items_${chunkIndex}`] = currentChunk;
                    chunkIndex++;
                    currentChunk = itemStr;
                } else {
                    if (currentChunk) currentChunk += ',';
                    currentChunk += itemStr;
                }
            });
            if (currentChunk) {
                metadata[`items_${chunkIndex}`] = currentChunk;
            }
        }

        const paymentIntentData: any = {
            amount: toStripeCents(total),
            currency: 'cad',
            metadata,
            automatic_payment_methods: {
                enabled: true,
            },
        };

        if (useStripeConnect) {
            if (businessModel === BusinessModel.PLATFORM_PAYS_FEES) {
                // DESTINATION CHARGE - Platform pays Stripe fees
                // Platform collects tiered fee, absorbs Stripe costs
                // Merchant receives: subtotal + tax (Stripe fees paid by platform)
                paymentIntentData.application_fee_amount = toStripeCents(platformFee);
                paymentIntentData.transfer_data = {
                    destination: truck.owner.stripeConnectId,
                };
            }

            else if (businessModel === BusinessModel.MERCHANT_PAYS_FEES) {
                // MERCHANT PAYS STRIPE FEES - Destination charge with explicit transfer
                // Customer pays: subtotal + tax + platformFee (3%)
                // Platform receives: platformFee (3% commission) as profit
                // Merchant receives: subtotal + tax - stripeFee
                // 
                // We use explicit transfer_data.amount to deduct Stripe fee from merchant
                // Platform keeps: total - transferAmount - stripeFee paid to Stripe
                //               = platformFee (exactly what we want!)

                // Calculate Stripe fee that platform will pay
                const stripePercentage = 0.029; // 2.9%
                const stripeFixed = 0.30; // $0.30 CAD
                const estimatedStripeFee = (total * stripePercentage) + stripeFixed;

                // Merchant gets subtotal + tax minus the Stripe fee
                const merchantPayout = subtotal + tax - estimatedStripeFee;

                paymentIntentData.transfer_data = {
                    destination: truck.owner.stripeConnectId,
                    amount: toStripeCents(merchantPayout), // Explicit amount after Stripe deduction
                };
                // No application_fee_amount needed - platform keeps (total - merchantPayout)
                // After Stripe takes their fee from platform, we're left with platformFee (3%)
            }

            else if (businessModel === BusinessModel.HYBRID) {
                // HYBRID MODEL (Stripe-recommended approach)
                // Customer pays: subtotal + tax + platformFee (tiered service fee)
                // Merchant pays: 1% application fee to platform
                // Platform absorbs Stripe fees
                // 
                // Using application_fee_amount for the combined platform take:
                // = Customer service fee + 1% from merchant

                const merchantFee = subtotal * 0.01; // 1% from merchant's cut
                const totalPlatformFee = platformFee + merchantFee; // Combined platform take

                paymentIntentData.application_fee_amount = toStripeCents(totalPlatformFee);
                paymentIntentData.transfer_data = {
                    destination: truck.owner.stripeConnectId,
                };
                // Stripe automatically deducts application_fee_amount and sends to platform
                // Merchant receives: total - totalPlatformFee - Stripe fees
            }

            else {
                // Fallback: treat as MERCHANT_PAYS_FEES (same logic)
                const stripePercentage = 0.029;
                const stripeFixed = 0.30;
                const estimatedStripeFee = (total * stripePercentage) + stripeFixed;
                const merchantPayout = subtotal + tax - estimatedStripeFee;

                paymentIntentData.transfer_data = {
                    destination: truck.owner.stripeConnectId,
                    amount: toStripeCents(merchantPayout),
                };
            }
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            orderNumber,
            breakdown: {
                businessModel,
                subtotal,
                tax,
                platformFee,
                stripeFee,
                platformProfit,
                merchantPayout,
                total,
                feePercentage,
            },
        });

    } catch (error: any) {
        console.error('Payment intent creation failed:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create payment intent' },
            { status: 500 }
        );
    }
}
