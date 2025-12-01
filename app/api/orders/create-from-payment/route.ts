// Fallback API to create order from payment intent if webhook didn't fire
// This is used when the webhook fails or in development

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { paymentIntentId, orderNumber } = await req.json();

        if (!paymentIntentId || !orderNumber) {
            return NextResponse.json(
                { error: 'Missing paymentIntentId or orderNumber' },
                { status: 400 }
            );
        }

        console.log(`[FALLBACK] Creating order from payment intent: ${paymentIntentId}, Order: ${orderNumber}`);

        // Check if order already exists
        const existingOrder = await prisma.order.findUnique({
            where: { orderNumber },
        });

        if (existingOrder) {
            console.log(`[FALLBACK] Order already exists, returning existing order`);
            return NextResponse.json({
                success: true,
                order: existingOrder,
                message: 'Order already exists',
            });
        }

        // Retrieve payment intent from Stripe
        console.log(`[FALLBACK] Retrieving payment intent from Stripe...`);
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // Only create order if payment succeeded
        if (paymentIntent.status !== 'succeeded') {
            console.error(`[FALLBACK] Payment not succeeded. Status: ${paymentIntent.status}`);
            return NextResponse.json(
                { error: `Payment not succeeded. Status: ${paymentIntent.status}` },
                { status: 400 }
            );
        }

        console.log(`[FALLBACK] Payment succeeded, creating order...`);

        // Parse order data from metadata
        const metadata = paymentIntent.metadata;
        const items = JSON.parse(metadata.items || '[]');

        // Create order
        const order = await prisma.order.create({
            data: {
                orderNumber: metadata.orderNumber || orderNumber,
                truckId: metadata.truckId,
                userId: metadata.userId || null,
                customerName: metadata.customerName || null,
                customerEmail: metadata.customerEmail || null,
                customerPhone: metadata.customerPhone || null,
                items: items,
                subtotal: parseFloat(metadata.subtotal),
                tax: parseFloat(metadata.tax),
                platformFee: parseFloat(metadata.platformFee),
                total: paymentIntent.amount / 100,
                stripePaymentId: paymentIntent.id,
                stripeStatus: paymentIntent.status,
                status: 'PENDING',
            },
        });

        console.log(`[FALLBACK] ✅ Order created successfully: ${order.orderNumber} (ID: ${order.id})`);

        return NextResponse.json({
            success: true,
            order,
            message: 'Order created from payment intent',
        });

    } catch (error: any) {
        console.error('Failed to create order from payment intent:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create order' },
            { status: 500 }
        );
    }
}

