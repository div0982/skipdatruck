// Pickup Confirmation API
// Handles staff confirmation of order pickup with code validation

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validatePickupCodeFormat } from '@/lib/pickup-codes';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, pickupCode, staffName, notes, photoBase64 } = body;

        // Validate inputs
        if (!orderId || !pickupCode) {
            return NextResponse.json(
                { error: 'Order ID and pickup code are required' },
                { status: 400 }
            );
        }

        // Validate code format
        if (!validatePickupCodeFormat(pickupCode)) {
            return NextResponse.json(
                { error: 'Invalid pickup code format. Must be 4 digits.' },
                { status: 400 }
            );
        }

        // Find the order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { pickupEvent: true },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Check if already picked up
        if (order.pickupEvent) {
            return NextResponse.json(
                { error: 'Order already picked up' },
                { status: 400 }
            );
        }

        // Verify pickup code
        if (order.pickupCode !== pickupCode) {
            return NextResponse.json(
                { error: 'Invalid pickup code' },
                { status: 403 }
            );
        }

        // Handle photo upload if provided
        let photoUrl: string | null = null;
        if (photoBase64) {
            try {
                // For now, we'll skip photo storage and add it later
                // TODO: Implement Supabase Storage upload
                photoUrl = null;  // Will be implemented with Supabase Storage
            } catch (error) {
                console.error('Photo upload failed:', error);
                // Continue without photo
            }
        }

        // Create pickup event
        const pickupEvent = await prisma.pickupEvent.create({
            data: {
                orderId,
                staffName: staffName || null,
                photoUrl,
                notes: notes || null,
            },
        });

        // Update order status to PICKED_UP
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'PICKED_UP',
                completedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            pickupEvent: {
                id: pickupEvent.id,
                pickedAt: pickupEvent.pickedAt,
                staffName: pickupEvent.staffName,
            },
        });

    } catch (error: any) {
        console.error('Pickup confirmation failed:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to confirm pickup' },
            { status: 500 }
        );
    }
}
