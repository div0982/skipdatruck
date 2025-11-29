// Get single order details
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        // In Next.js 16, params may be a Promise
        const params = context.params instanceof Promise ? await context.params : context.params;

        if (!params?.id) {
            return NextResponse.json(
                { error: 'Missing order id in URL' },
                { status: 400 }
            );
        }

        const order = await prisma.order.findUnique({
            where: { id: params.id },
            include: {
                truck: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(order);

    } catch (error: any) {
        console.error('Failed to fetch order:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}
