import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
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

        // Check if truck exists and get owner info
        const truck = await prisma.foodTruck.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
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

        const ownerId = truck.owner.id;
        const ownerEmail = truck.owner.email;

        // Hard delete: Delete in order to avoid FK constraints
        // 1. Delete all orders (pickup events cascade automatically)
        // 2. Delete all menu items
        // 3. Delete the truck
        // 4. Delete the owner's User account (allows email reuse)

        const deletedOrders = await prisma.order.deleteMany({
            where: { truckId: id },
        });

        const deletedMenuItems = await prisma.menuItem.deleteMany({
            where: { truckId: id },
        });

        // Delete the truck
        await prisma.foodTruck.delete({
            where: { id },
        });

        // Delete the owner's User account so email can be reused
        await prisma.user.delete({
            where: { id: ownerId },
        });

        return NextResponse.json({
            success: true,
            message: `Truck "${truck.name}" and owner account (${ownerEmail}) deleted permanently`,
            deletedCounts: {
                orders: deletedOrders.count,
                menuItems: deletedMenuItems.count,
                userAccountDeleted: true,
            },
        });

    } catch (error: any) {
        console.error('Truck deletion failed:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete truck' },
            { status: 500 }
        );
    }
}
