// Stripe Express Dashboard Login API
// Generates a login link for merchants to access their Stripe dashboard

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId' },
                { status: 400 }
            );
        }

        // Get user's Stripe account
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.stripeConnectId) {
            return NextResponse.json(
                { error: 'No Stripe account found' },
                { status: 404 }
            );
        }

        // Create login link for Express dashboard
        const loginLink = await stripe.accounts.createLoginLink(user.stripeConnectId);

        return NextResponse.json({
            url: loginLink.url,
        });

    } catch (error: any) {
        console.error('Failed to create Stripe dashboard login link:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create login link' },
            { status: 500 }
        );
    }
}
