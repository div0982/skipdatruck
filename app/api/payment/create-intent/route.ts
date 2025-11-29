// Stripe Payment Intent API
// Creates payment with platform fee for Stripe Connect

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { calculateTax } from '@/lib/tax-calculator';
import {
    calculatePlatformFee,
    calculateStripeFee,
    calculateMerchantPayout,
    toStripeCents,
    calculateTotal
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
            include: { owner: true },
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

        // Calculate tax based on province
        const tax = calculateTax(subtotal, truck.province);

        // Calculate platform fee (4% + $0.10 CAD)
        const platformFee = calculatePlatformFee(subtotal);

        // Calculate Stripe fee (applies to merchant portion: subtotal + tax)
        const stripeFee = calculateStripeFee(subtotal, tax);

        // Calculate merchant payout (subtotal + tax - stripeFee)
        const merchantPayout = calculateMerchantPayout(subtotal, tax);

        // Calculate customer total (subtotal + tax + platformFee)
        const total = calculateTotal(subtotal, tax, platformFee);

        // Validation: Ensure all money is accounted for
        // total should equal: merchantPayout + platformFee + stripeFee
        const totalCheck = merchantPayout + platformFee + stripeFee;
        if (Math.abs(totalCheck - total) > 0.01) {
            console.error('Fee calculation error:', {
                total,
                merchantPayout,
                platformFee,
                stripeFee,
                totalCheck,
                difference: totalCheck - total
            });
            return NextResponse.json(
                { error: 'Fee calculation error. Please contact support.' },
                { status: 500 }
            );
        }

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Create order in database
        const order = await prisma.order.create({
            data: {
                orderNumber,
                truckId,
                userId: customerInfo?.userId || null,
                customerName: customerInfo?.name,
                customerEmail: customerInfo?.email,
                customerPhone: customerInfo?.phone,
                items,
                subtotal,
                tax,
                platformFee,
                total,
                status: 'PENDING',
            },
        });

        // Create Stripe Payment Intent
        const paymentIntentData: any = {
            // Customer pays full amount including platform fee
            amount: toStripeCents(total),
            currency: 'cad',
            metadata: {
                orderId: order.id,
                orderNumber,
                truckId,
                truckName: truck.name,
                subtotal: subtotal.toFixed(2),
                tax: tax.toFixed(2),
                platformFee: platformFee.toFixed(2),
                stripeFee: stripeFee.toFixed(2),
                merchantPayout: merchantPayout.toFixed(2),
            },
            automatic_payment_methods: {
                enabled: true,
            },
        };

        // Add Connect-specific fields only if using Stripe Connect
        if (useStripeConnect) {
            // Use destination charges with specific transfer amount
            // This makes Stripe charge fees ONLY on the transfer amount (subtotal + tax)
            // NOT on the application fee (platform fee)

            const transferAmount = subtotal + tax; // $17.25 - merchant's portion

            paymentIntentData.application_fee_amount = toStripeCents(platformFee); // $0.70 to platform
            paymentIntentData.transfer_data = {
                destination: truck.owner.stripeConnectId,
                amount: toStripeCents(transferAmount), // Merchant gets this amount, pays fees on it
            };

            // Result:
            // - Customer pays: $17.95 (subtotal + tax + platformFee)
            // - Merchant receives transfer: $17.25 (subtotal + tax)
            // - Merchant pays Stripe fees on: $17.25 only (~$0.80)
            // - Platform receives: $0.70 (no Stripe fees on this!)
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

        // Update order with payment intent ID
        await prisma.order.update({
            where: { id: order.id },
            data: { stripePaymentId: paymentIntent.id },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            orderId: order.id,
            orderNumber,
            breakdown: {
                subtotal,
                tax,
                platformFee,
                stripeFee,
                merchantPayout,
                total,
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

