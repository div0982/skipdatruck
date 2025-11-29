// API to get current user's truck
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const truck = await prisma.foodTruck.findFirst({
            where: {
                ownerId: session.user.id,
                isActive: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!truck) {
            return NextResponse.json(
                { error: 'No truck found' },
                { status: 404 }
            );
        }

        return NextResponse.json(truck);
    } catch (error) {
        console.error('Error fetching user truck:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
