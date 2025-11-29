// Food Trucks API
// Get all trucks or create new truck

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTaxRate } from '@/lib/tax-calculator';
import { Province } from '@prisma/client';

// Get all food trucks
export async function GET() {
    try {
        const trucks = await prisma.foodTruck.findMany({
            where: { isActive: true },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        stripeOnboarded: true,
                    },
                },
                _count: {
                    select: {
                        menuItems: true,
                        orders: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(trucks);

    } catch (error: any) {
        console.error('Failed to fetch trucks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch trucks' },
            { status: 500 }
        );
    }
}

// Create new food truck
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ownerId, name, description, address, province, logoUrl, bannerUrl } = body;

        if (!ownerId || !name || !address || !province) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get correct tax rate for province
        const taxRate = getTaxRate(province as Province);

        const truck = await prisma.foodTruck.create({
            data: {
                ownerId,
                name,
                description,
                address,
                province: province as Province,
                taxRate,
                logoUrl,
                bannerUrl,
            },
        });

        return NextResponse.json(truck);

    } catch (error: any) {
        console.error('Failed to create truck:', error);
        return NextResponse.json(
            { error: 'Failed to create food truck' },
            { status: 500 }
        );
    }
}
