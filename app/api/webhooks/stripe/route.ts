// Stripe Webhook Handler
// Handles payment_intent.succeeded and other webhook events

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing stripe-signature header' },
                { status: 400 }
            );
        }

        // Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json(
                { error: 'Webhook signature verification failed' },
                { status: 400 }
            );
        }

        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;

                // Create order NOW that payment has succeeded
                // Parse order data from metadata
                const metadata = paymentIntent.metadata;
                
                // Reconstruct items from metadata (handles both single field and chunked format)
                let items: any[] = [];
                if (metadata.items) {
                    // Single items field (small orders)
                    try {
                        items = JSON.parse(metadata.items);
                    } catch (e) {
                        console.error('[WEBHOOK] Failed to parse items from metadata.items:', e);
                    }
                } else if (metadata.itemCount) {
                    // Chunked format (large orders)
                    try {
                        const itemCount = parseInt(metadata.itemCount);
                        let allItemsJson = '';
                        let chunkIndex = 0;
                        while (metadata[`items_${chunkIndex}`]) {
                            if (allItemsJson) allItemsJson += ',';
                            allItemsJson += metadata[`items_${chunkIndex}`];
                            chunkIndex++;
                        }
                        // Parse as JSON array
                        items = JSON.parse(`[${allItemsJson}]`);
                    } catch (e) {
                        console.error('[WEBHOOK] Failed to parse chunked items from metadata:', e);
                    }
                }

                // Transform minimal items back to full format for order storage
                // Items are stored as: { id, qty, price, name? }
                // We need: { menuItemId, name, price, quantity }
                const fullItems = items.map((item: any) => ({
                    menuItemId: item.id,
                    name: item.name || `Item ${item.id}`,
                    price: parseFloat(item.price),
                    quantity: item.qty || item.quantity || 1,
                }));

                const order = await prisma.order.create({
                    data: {
                        orderNumber: metadata.orderNumber,
                        truckId: metadata.truckId,
                        userId: metadata.userId || null,
                        customerName: metadata.customerName || null,
                        customerEmail: metadata.customerEmail || null,
                        customerPhone: metadata.customerPhone || null,
                        items: fullItems,
                        subtotal: parseFloat(metadata.subtotal),
                        tax: parseFloat(metadata.tax),
                        platformFee: parseFloat(metadata.platformFee),
                        total: paymentIntent.amount / 100, // Convert from cents
                        stripePaymentId: paymentIntent.id,
                        stripeStatus: paymentIntent.status,
                        status: 'PENDING', // Order is now pending acknowledgment by truck
                    },
                });

                console.log(`[WEBHOOK] ✅ Payment succeeded - Order created: ${order.orderNumber} (${order.id})`);
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;

                // Payment failed - no order was created, so nothing to update
                // Just log it
                console.log(`Payment failed for payment intent: ${paymentIntent.id} (Order: ${paymentIntent.metadata.orderNumber})`);
                break;
            }

            case 'account.updated': {
                const account = event.data.object as Stripe.Account;

                // Update truck owner's onboarding status
                if (account.charges_enabled && account.payouts_enabled) {
                    await prisma.user.update({
                        where: { stripeConnectId: account.id },
                        data: { stripeOnboarded: true },
                    });
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('Webhook handling failed:', error);
        return NextResponse.json(
            { error: 'Webhook handling failed' },
            { status: 500 }
        );
    }
}
