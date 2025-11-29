// Helper to get user's first truck from session
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function getUserTruck() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return null;
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

    return truck;
}
