// API endpoint to update/delete specific menu items
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Verify ownership
        const menuItem = await prisma.menuItem.findUnique({
            where: { id },
            include: { truck: true },
        });

        if (!menuItem || menuItem.truck.ownerId !== session.user.id) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        // Update the menu item
        const updated = await prisma.menuItem.update({
            where: { id },
            data: {
                name: body.name,
                description: body.description,
                price: body.price,
                category: body.category,
                isAvailable: body.isAvailable !== undefined ? body.isAvailable : menuItem.isAvailable,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error updating menu item:', error);
        return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const menuItem = await prisma.menuItem.findUnique({
            where: { id },
            include: { truck: true },
        });

        if (!menuItem || menuItem.truck.ownerId !== session.user.id) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        // Delete the menu item
        await prisma.menuItem.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting menu item:', error);
        return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
    }
}
