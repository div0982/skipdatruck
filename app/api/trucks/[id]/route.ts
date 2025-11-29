// Single Food Truck API
// Get, update, delete specific truck

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateTruckQRCode } from '@/lib/qr-generator';

// Get single truck with menu
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const truck = await prisma.foodTruck.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        stripeOnboarded: true,
                    },
                },
                menuItems: {
                    where: { isAvailable: true },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            },
        });

        if (!truck) {
            return NextResponse.json(
                { error: 'Food truck not found' },
                { status: 404 }
            );
        }

        // Generate QR code if not exists
        if (!truck.qrCodeUrl) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const qrDataUrl = await generateTruckQRCode(truck.id, baseUrl);

            await prisma.foodTruck.update({
                where: { id: truck.id },
                data: { qrCodeUrl: qrDataUrl },
            });

            truck.qrCodeUrl = qrDataUrl;
        }

        return NextResponse.json(truck);

    } catch (error: any) {
        console.error('Failed to fetch truck:', error);
        return NextResponse.json(
            { error: 'Failed to fetch food truck' },
            { status: 500 }
        );
    }
}

// Update truck
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();

        const truck = await prisma.foodTruck.update({
            where: { id },
            data: body,
        });

        return NextResponse.json(truck);

    } catch (error: any) {
        console.error('Failed to update truck:', error);
        return NextResponse.json(
            { error: 'Failed to update food truck' },
            { status: 500 }
        );
    }
}

// Delete truck
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        await prisma.foodTruck.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Failed to delete truck:', error);
        return NextResponse.json(
            { error: 'Failed to delete food truck' },
            { status: 500 }
        );
    }
}
