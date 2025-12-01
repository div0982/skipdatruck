import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Check if user is admin
        const session = await getServerSession(authOptions);

        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        const { id: userId } = await params;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { ownedTrucks: true }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Delete user (cascade will delete trucks, orders, etc.)
        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({
            success: true,
            message: `Deleted merchant account: ${user.email}`
        });

    } catch (error: any) {
        console.error('Delete merchant error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete merchant' },
            { status: 500 }
        );
    }
}
