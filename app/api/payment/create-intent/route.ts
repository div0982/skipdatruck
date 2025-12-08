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

        // For testing: Allow payments without Stripe Connect
        // In production, uncomment the check below
        const useStripeConnect = truck.owner.stripeConnectId && truck.owner.stripeOnboarded;

        // Uncomment for production:
        // if (!truck.owner.stripeConnectId || !truck.owner.stripeOnboarded) {
        //     return NextResponse.json(
        //         { error: 'This truck is not set up to accept payments' },
        //         { status: 400 }
        //     );
        // }

        // Calculate subtotal
        const subtotal = items.reduce((sum: number, item: any) => {
            return sum + (item.price * item.quantity);
        }, 0);

        // Get tax rate from truck
        const taxRate = truck.taxRate;

        // Get merchant's business model (defaults to MERCHANT_PAYS_FEES if not set)
        // Cast Prisma's BusinessModel to our fee-calculator's BusinessModel
        const businessModel = (truck.owner.businessModel || 'MERCHANT_PAYS_FEES') as BusinessModel;

        // Calculate all fees using unified fee calculator
        const feeBreakdown = calculateFees(subtotal, taxRate, businessModel);

        const {
            platformFee,
            taxAmount: tax,
            totalPayment: total,
            stripeFee,
            platformProfit,
            feePercentage
        } = feeBreakdown;

        // Calculate merchant payout based on business model
        let merchantPayout: number;
        if (businessModel === BusinessModel.MERCHANT_PAYS_FEES) {
            // Merchant pays Stripe fees directly
            // They receive: subtotal + tax (and pay Stripe separately)
            merchantPayout = subtotal + tax;
        } else {
            // Platform pays Stripe fees
            // Merchant receives: subtotal + tax - stripeFee
            merchantPayout = subtotal + tax - stripeFee;
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

        // Generate order number
        const orderNumber = generateOrderNumber();

        // DON'T create order yet - wait for payment confirmation
        // Store all order data in PaymentIntent metadata instead
        // IMPORTANT: Stripe metadata has a 500-character limit per value
        // So we store minimal item data (ID, quantity, price) and fetch full details later

        // Create minimal item representation to avoid metadata size limits
        const minimalItems = items.map((item: any) => ({
            id: item.menuItemId || item.id,
            qty: item.quantity,
            price: item.price.toFixed(2),
            // Store name only if it's short (for display), otherwise we'll fetch from DB
            name: item.name && item.name.length <= 50 ? item.name.substring(0, 50) : '',
        }));

        // Try to store items as JSON, but if it's too large, split across multiple metadata fields
        const itemsJson = JSON.stringify(minimalItems);
        const metadata: Record<string, string> = {
            // Order data to create after payment succeeds
            orderNumber,
            truckId,
            truckName: truck.name.substring(0, 100), // Limit truck name length
            businessModel,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            platformFee: platformFee.toFixed(2),
            stripeFee: stripeFee.toFixed(2),
            platformProfit: platformProfit.toFixed(2),
            merchantPayout: merchantPayout.toFixed(2),
            // Customer info (truncate to avoid size issues)
            customerName: (customerInfo?.name || '').substring(0, 100),
            customerEmail: (customerInfo?.email || '').substring(0, 100),
            customerPhone: (customerInfo?.phone || '').substring(0, 20),
            userId: (customerInfo?.userId || '').substring(0, 100),
        };

        // Store items - if JSON is too large, split it
        if (itemsJson.length <= 450) {
            // Safe to store in single field
            metadata.items = itemsJson;
        } else {
            // Split items across multiple metadata fields
            // Store item count first
            metadata.itemCount = minimalItems.length.toString();
            // Store items in chunks (each chunk max 450 chars)
            let chunkIndex = 0;
            let currentChunk = '';
            minimalItems.forEach((item: { id: string; qty: number; price: string; name: string }) => {
                const itemStr = JSON.stringify(item);
                if (currentChunk.length + itemStr.length + 1 > 450) {
                    // Save current chunk
                    metadata[`items_${chunkIndex}`] = currentChunk;
                    chunkIndex++;
                    currentChunk = itemStr;
                } else {
                    if (currentChunk) currentChunk += ',';
                    currentChunk += itemStr;
                }
            });
            // Save last chunk
            if (currentChunk) {
                metadata[`items_${chunkIndex}`] = currentChunk;
            }
        }

        const paymentIntentData: any = {
            // Customer pays full amount including platform fee
            amount: toStripeCents(total),
            currency: 'cad',
            metadata,
            automatic_payment_methods: {
                enabled: true,
            },
        };

        // Add Connect-specific fields only if using Stripe Connect
        if (useStripeConnect) {
            if (businessModel === BusinessModel.PLATFORM_PAYS_FEES) {
                // Platform pays Stripe fees - use application fee
                // Platform keeps: platformFee
                // Merchant receives: subtotal + tax - stripe fee (calculated by Stripe)
                paymentIntentData.application_fee_amount = toStripeCents(platformFee);
                paymentIntentData.transfer_data = {
                    destination: truck.owner.stripeConnectId,
                };
            } else if (businessModel === BusinessModel.HYBRID) {
                // HYBRID: Platform pays fees + 1% application fee from merchant
                // Platform keeps: platformFee (from customer) + 1% of total (from merchant payout)
                // Application fee: 1% of order total (deducted from merchant)
                const applicationFeeAmount = subtotal * 0.01;
                const totalApplicationFee = platformFee + applicationFeeAmount;

                paymentIntentData.application_fee_amount = toStripeCents(totalApplicationFee);
                paymentIntentData.transfer_data = {
                    destination: truck.owner.stripeConnectId,
                };
            } else {
                // Merchant pays Stripe fees - use direct transfer
                // Platform takes commission upfront, merchant pays their own Stripe fees
                paymentIntentData.application_fee_amount = toStripeCents(platformFee);
                paymentIntentData.transfer_data = {
                    destination: truck.owner.stripeConnectId,
                };
            }
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

        // Return payment intent - order will be created in webhook after payment succeeds
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
