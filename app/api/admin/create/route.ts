import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Simple admin creation endpoint - REMOVE IN PRODUCTION
export async function POST(request: NextRequest) {
    try {
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

            return NextResponse.json({
                success: true,
                message: 'Admin account updated'
            });
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

        return NextResponse.json({
            success: true,
            message: 'Admin account created',
            credentials: {
                email,
                password,
                loginUrl: '/login'
            }
        });

    } catch (error: any) {
        console.error('Create admin error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create admin' },
            { status: 500 }
        );
    }
}
