// Shop Status Update API
// Allows merchants to update their shop status (OPEN/PAUSED/CLOSED)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id: truckId } = await context.params;
        const body = await req.json();
        const { shopStatus } = body;

        // Validate shop status
        if (!['OPEN', 'PAUSED', 'CLOSED'].includes(shopStatus)) {
            return NextResponse.json(
                { error: 'Invalid shop status. Must be OPEN, PAUSED, or CLOSED' },
                { status: 400 }
            );
        }

        // Verify ownership
        const truck = await prisma.foodTruck.findFirst({
            where: {
                id: truckId,
                ownerId: session.user.id,
            },
        });

        if (!truck) {
            return NextResponse.json(
                { error: 'Food truck not found or unauthorized' },
                { status: 404 }
            );
        }

        // Update shop status
        const updatedTruck = await prisma.foodTruck.update({
            where: { id: truckId },
            data: { shopStatus },
        });

        return NextResponse.json({
            success: true,
            shopStatus: updatedTruck.shopStatus,
        });

    } catch (error: any) {
        console.error('Failed to update shop status:', error);
        return NextResponse.json(
            { error: 'Failed to update shop status' },
            { status: 500 }
        );
    }
}
