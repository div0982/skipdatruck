// Orders API
// CRUD operations for orders

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

// Get orders (with filters)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const truckId = searchParams.get('truckId');
        const userId = searchParams.get('userId');
        const statusParam = searchParams.get('status');
        const orderNumber = searchParams.get('orderNumber');

        const where: any = {};
        if (truckId) where.truckId = truckId;
        if (userId) where.userId = userId;
        if (orderNumber) where.orderNumber = orderNumber;
        
        // Only show orders where payment succeeded (unless searching by orderNumber for success page)
        // This ensures merchants only see orders that were actually paid for
        if (!orderNumber) {
            where.stripeStatus = 'succeeded';
            where.stripePaymentId = { not: null };
        }
        
        // Handle multiple statuses (comma-separated) or single status
        if (statusParam) {
            const statuses = statusParam.split(',').map(s => s.trim());
            if (statuses.length === 1) {
                where.status = statuses[0] as OrderStatus;
            } else {
                // Use Prisma's `in` operator for multiple statuses
                where.status = { in: statuses as OrderStatus[] };
            }
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                truck: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        logoUrl: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(orders);

    } catch (error: any) {
        console.error('Failed to fetch orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

// Update order status
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, status } = body;

        if (!orderId || !status) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                ...(status === 'COMPLETED' && { completedAt: new Date() }),
            },
        });

        return NextResponse.json(order);

    } catch (error: any) {
        console.error('Failed to update order:', error);
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        );
    }
}
