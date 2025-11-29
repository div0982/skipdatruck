// Stripe Payment Intent API
// Creates payment with platform fee for Stripe Connect

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { calculateTax } from '@/lib/tax-calculator';
import { calculatePlatformFee, toStripeCents, calculateTotal } from '@/lib/fee-calculator';
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

        // Calculate total
        const total = calculateTotal(subtotal, tax, platformFee);

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Create order in database (stripePaymentId will be set after PaymentIntent is created)
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
            amount: toStripeCents(total),
            currency: 'cad',
            metadata: {
                orderId: order.id,
                orderNumber,
                truckId,
                truckName: truck.name,
            },
            automatic_payment_methods: {
                enabled: true,
            },
        };

        // Add Connect-specific fields only if using Stripe Connect
        if (useStripeConnect) {
            paymentIntentData.application_fee_amount = toStripeCents(platformFee);
            paymentIntentData.transfer_data = {
                destination: truck.owner.stripeConnectId,
            };
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
