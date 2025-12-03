// Fallback API to create order from payment intent if webhook didn't fire
// This is used when the webhook fails or in development

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { generatePickupCode } from '@/lib/pickup-codes';

export async function POST(req: NextRequest) {
    let orderNumber: string | undefined;
    let paymentIntentId: string | undefined;

    try {
        const body = await req.json();
        paymentIntentId = body.paymentIntentId;
        orderNumber = body.orderNumber;

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
            include: {
                truck: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        logoUrl: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
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

        // Reconstruct items from metadata (handles both single field and chunked format)
        let items: any[] = [];
        if (metadata.items) {
            // Single items field (small orders)
            try {
                items = JSON.parse(metadata.items);
            } catch (e) {
                console.error('[FALLBACK] Failed to parse items from metadata.items:', e);
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
                console.error('[FALLBACK] Failed to parse chunked items from metadata:', e);
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

        // Generate pickup code
        const pickupCode = generatePickupCode();

        // Create order
        const order = await prisma.order.create({
            data: {
                orderNumber: metadata.orderNumber || orderNumber,
                truckId: metadata.truckId,
                userId: metadata.userId || null,
                customerName: metadata.customerName || null,
                customerEmail: metadata.customerEmail || null,
                customerPhone: metadata.customerPhone || null,
                items: fullItems,
                subtotal: parseFloat(metadata.subtotal),
                tax: parseFloat(metadata.tax),
                platformFee: parseFloat(metadata.platformFee),
                total: paymentIntent.amount / 100,
                stripePaymentId: paymentIntent.id,
                stripeStatus: paymentIntent.status,
                pickupCode,  // Add pickup code
                status: 'PENDING',
            },
        });

        console.log(`[FALLBACK] ✅ Order created successfully: ${order.orderNumber} (ID: ${order.id})`);

        // Fetch the order with truck relation for the response
        const orderWithRelations = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
                truck: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        logoUrl: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            order: orderWithRelations || order,
            message: 'Order created from payment intent',
        });

    } catch (error: any) {
        console.error('Failed to create order from payment intent:', error);

        // If it's a unique constraint error, the order likely already exists
        // Try to fetch and return it
        if ((error.code === 'P2002' || error.message?.includes('Unique constraint')) && orderNumber) {
            console.log(`[FALLBACK] Order already exists (unique constraint). Fetching existing order...`);
            try {
                const existingOrder = await prisma.order.findUnique({
                    where: { orderNumber },
                    include: {
                        truck: {
                            select: {
                                id: true,
                                name: true,
                                address: true,
                                logoUrl: true,
                            },
                        },
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                });

                if (existingOrder) {
                    console.log(`[FALLBACK] ✅ Found existing order: ${existingOrder.orderNumber}`);
                    return NextResponse.json({
                        success: true,
                        order: existingOrder,
                        message: 'Order already exists (created by webhook)',
                    });
                }
            } catch (fetchError) {
                console.error('[FALLBACK] Failed to fetch existing order:', fetchError);
            }
        }

        return NextResponse.json(
            { error: error.message || 'Failed to create order' },
            { status: 500 }
        );
    }
}

