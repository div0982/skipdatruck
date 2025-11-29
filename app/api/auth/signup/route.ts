import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists with this email' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with TRUCK_OWNER role
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'TRUCK_OWNER', // Merchants are truck owners
            },
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error: any) {
        console.error('Signup error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
        });
        return NextResponse.json(
            {
                error: 'Failed to create account',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
