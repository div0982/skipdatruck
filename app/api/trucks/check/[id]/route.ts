// Check if a truck exists
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const truck = await prisma.foodTruck.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                isActive: true,
            },
        });

        if (!truck) {
            return NextResponse.json(
                { exists: false, message: 'Truck not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            exists: true,
            truck: {
                id: truck.id,
                name: truck.name,
                isActive: truck.isActive,
            },
        });
    } catch (error: any) {
        console.error('Error checking truck:', error);
        return NextResponse.json(
            { exists: false, error: error.message },
            { status: 500 }
        );
    }
}
