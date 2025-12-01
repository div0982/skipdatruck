import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

async function createAdminAccount() {
    const email = 'diveshasenthil@gmail.com';
    const password = 'truck@2025';

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
        where: { email }
    });

    if (existing) {
        // Update to ensure it has ADMIN role and correct password
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: {
                role: 'ADMIN',
                password: hashedPassword,
            }
        });

        return {
            success: true,
            message: 'Admin account updated',
            credentials: {
                email,
                password,
                loginUrl: '/login'
            }
        };
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: 'Admin',
            role: 'ADMIN',
        }
    });

    return {
        success: true,
        message: 'Admin account created',
        credentials: {
            email,
            password,
            loginUrl: '/login'
        }
    };
}

// GET handler - just visit the URL in browser
export async function GET() {
    try {
        const result = await createAdminAccount();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Create admin error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create admin' },
            { status: 500 }
        );
    }
}

// POST handler - same functionality
export async function POST(request: NextRequest) {
    try {
        const result = await createAdminAccount();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Create admin error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create admin' },
            { status: 500 }
        );
    }
}
