// Demo User API - Creates a demo user for localhost development
// In production, this would use proper authentication

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email } = body;

        // Generate a unique email if not provided
        const userEmail = email || `demo-${Date.now()}-${Math.random().toString(36).substring(7)}@foodtruck.local`;
        const userName = name || 'Demo Owner';

        // Check if user already exists
        let user = await prisma.user.findUnique({
            where: { email: userEmail },
        });

        if (!user) {
            // Create new demo user
            // Use a simple password hash for demo purposes
            const hashedPassword = await bcrypt.hash('demo123', 10);

            user = await prisma.user.create({
                data: {
                    email: userEmail,
                    password: hashedPassword,
                    role: 'TRUCK_OWNER',
                    name: userName,
                },
            });
        }

        return NextResponse.json(user);

    } catch (error: any) {
        console.error('Failed to create/get demo user:', error);
        return NextResponse.json(
            { error: 'Failed to create user', details: error.message },
            { status: 500 }
        );
    }
}

