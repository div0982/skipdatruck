// Menu Items API
// CRUD operations for menu items

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Get menu items for a truck
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const truckId = searchParams.get('truckId');

        if (!truckId) {
            return NextResponse.json(
                { error: 'Missing truckId' },
                { status: 400 }
            );
        }

        const items = await prisma.menuItem.findMany({
            where: { truckId },
            orderBy: {
                sortOrder: 'asc',
            },
        });

        return NextResponse.json(items);

    } catch (error: any) {
        console.error('Failed to fetch menu items:', error);
        return NextResponse.json(
            { error: 'Failed to fetch menu items' },
            { status: 500 }
        );
    }
}

// Create menu item(s) - supports single item or batch
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { truckId, items, name, description, price, category, imageUrl } = body;

        // Batch create mode
        if (items && Array.isArray(items)) {
            if (!truckId) {
                return NextResponse.json(
                    { error: 'Missing truckId for batch create' },
                    { status: 400 }
                );
            }

            // Validate all items
            const validItems = items.filter(
                (item: any) => item.name && typeof item.price === 'number' && item.category
            );

            if (validItems.length === 0) {
                return NextResponse.json(
                    { error: 'No valid items to create' },
                    { status: 400 }
                );
            }

            // Get current max sortOrder for this truck
            const maxOrder = await prisma.menuItem.findFirst({
                where: { truckId },
                orderBy: { sortOrder: 'desc' },
                select: { sortOrder: true },
            });

            let nextSortOrder = (maxOrder?.sortOrder ?? -1) + 1;

            // Create all items
            const createdItems = await prisma.menuItem.createMany({
                data: validItems.map((item: any) => ({
                    truckId,
                    name: item.name,
                    description: item.description || '',
                    price: item.price,
                    category: item.category,
                    imageUrl: item.imageUrl || null,
                    sortOrder: nextSortOrder++,
                })),
            });

            return NextResponse.json({
                success: true,
                count: createdItems.count,
                message: `Created ${createdItems.count} menu items`,
            });
        }

        // Single item create mode (backward compatible)
        if (!truckId || !name || !price || !category) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const item = await prisma.menuItem.create({
            data: {
                truckId,
                name,
                description,
                price,
                category,
                imageUrl,
            },
        });

        return NextResponse.json(item);

    } catch (error: any) {
        console.error('Failed to create menu item:', error);
        return NextResponse.json(
            { error: 'Failed to create menu item', details: error.message },
            { status: 500 }
        );
    }
}

// Update menu item
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Missing item id' },
                { status: 400 }
            );
        }

        const item = await prisma.menuItem.update({
            where: { id },
            data,
        });

        return NextResponse.json(item);

    } catch (error: any) {
        console.error('Failed to update menu item:', error);
        return NextResponse.json(
            { error: 'Failed to update menu item' },
            { status: 500 }
        );
    }
}

// Delete menu item
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Missing item id' },
                { status: 400 }
            );
        }

        await prisma.menuItem.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Failed to delete menu item:', error);
        return NextResponse.json(
            { error: 'Failed to delete menu item' },
            { status: 500 }
        );
    }
}
