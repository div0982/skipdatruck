import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { role: true },
        });

        if (user?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Check if truck exists
        const truck = await prisma.foodTruck.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        orders: true,
                        menuItems: true,
                    },
                },
            },
        });

        if (!truck) {
            return NextResponse.json(
                { error: 'Truck not found' },
                { status: 404 }
            );
        }

        // Soft delete: Remove all orders and their pickup events
        // This preserves the truck account and menu items
        const deletedOrders = await prisma.order.deleteMany({
            where: { truckId: id },
        });

        return NextResponse.json({
            success: true,
            message: `Soft delete completed for "${truck.name}". Order history cleared.`,
            deletedCounts: {
                orders: deletedOrders.count,
                menuItemsKept: truck._count.menuItems,
            },
        });

    } catch (error: any) {
        console.error('Soft delete failed:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to soft delete truck data' },
            { status: 500 }
        );
    }
}
