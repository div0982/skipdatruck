// Stripe Connect Onboarding API
// Creates and manages Connect Express accounts for truck owners

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

// Create Connect account
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, email, truckId } = body;

        if (!userId || !email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user already has a Connect account
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get truck info for metadata
        let truckName = 'Food Truck';
        if (truckId) {
            const truck = await prisma.foodTruck.findUnique({
                where: { id: truckId },
            });
            if (truck) {
                truckName = truck.name;
            }
        }

        let accountId = user.stripeConnectId;

        // Create Connect account if doesn't exist
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                email,
                country: 'CA',
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                // Add business profile so you can see truck name in Stripe Dashboard
                business_profile: {
                    name: truckName,
                    support_email: email,
                },
                // Add metadata for easy filtering and identification
                metadata: {
                    truck_name: truckName,
                    truck_id: truckId || '',
                    user_id: userId,
                    platform: 'food_truck_qr',
                },
            });

            accountId = account.id;

            // Save to database
            await prisma.user.update({
                where: { id: userId },
                data: { stripeConnectId: accountId },
            });
        }

        // Create account link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/merchant`,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/merchant`,
            type: 'account_onboarding',
        });

        return NextResponse.json({
            url: accountLink.url,
            accountId,
        });

    } catch (error: any) {
        console.error('Connect account creation failed:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create Connect account' },
            { status: 500 }
        );
    }
}

// Get Connect account status
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.stripeConnectId) {
            return NextResponse.json({
                connected: false,
                onboarded: false,
            });
        }

        // Get account details from Stripe (real-time status)
        const account = await stripe.accounts.retrieve(user.stripeConnectId);

        const isOnboarded = account.charges_enabled && account.payouts_enabled;

        // Update database if status changed
        if (isOnboarded && !user.stripeOnboarded) {
            await prisma.user.update({
                where: { id: userId },
                data: { stripeOnboarded: true },
            });
        }

        return NextResponse.json({
            connected: true,
            onboarded: isOnboarded,
            accountId: user.stripeConnectId,
            details: {
                charges_enabled: account.charges_enabled,
                payouts_enabled: account.payouts_enabled,
            },
        });

    } catch (error: any) {
        console.error('Failed to get Connect account status:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
