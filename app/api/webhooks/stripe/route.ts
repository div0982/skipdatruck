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

                // Update order status
                await prisma.order.update({
                    where: { stripePaymentId: paymentIntent.id },
                    data: {
                        stripeStatus: paymentIntent.status,
                        status: 'PENDING', // Order is now pending acknowledgment by truck
                    },
                });

                console.log(`Payment succeeded for order: ${paymentIntent.metadata.orderNumber}`);
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;

                await prisma.order.update({
                    where: { stripePaymentId: paymentIntent.id },
                    data: {
                        stripeStatus: paymentIntent.status,
                        status: 'CANCELLED',
                    },
                });

                console.log(`Payment failed for order: ${paymentIntent.metadata.orderNumber}`);
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
