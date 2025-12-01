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

        // Check if order already exists
        const existingOrder = await prisma.order.findUnique({
            where: { orderNumber },
        });

        if (existingOrder) {
            return NextResponse.json({
                success: true,
                order: existingOrder,
                message: 'Order already exists',
            });
        }

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // Only create order if payment succeeded
        if (paymentIntent.status !== 'succeeded') {
            return NextResponse.json(
                { error: `Payment not succeeded. Status: ${paymentIntent.status}` },
                { status: 400 }
            );
        }

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

