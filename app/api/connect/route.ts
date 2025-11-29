// Stripe Connect Onboarding API
// Creates and manages Connect Express accounts for truck owners

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

// Create Connect account
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, email } = body;

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
            refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/merchant/connect/refresh`,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/merchant/connect/success`,
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

        // Get account details from Stripe
        const account = await stripe.accounts.retrieve(user.stripeConnectId);

        return NextResponse.json({
            connected: true,
            onboarded: account.charges_enabled && account.payouts_enabled,
            accountId: user.stripeConnectId,
        });

    } catch (error: any) {
        console.error('Failed to get Connect account status:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
