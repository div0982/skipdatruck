import { prisma } from '@/lib/db';
import Link from 'next/link';
import { MapPin, Utensils } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TrucksDirectoryPage() {
    const trucks = await prisma.foodTruck.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            description: true,
            address: true,
            province: true,
        },
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
                <div className="text-center space-y-4">
                    <p className="text-sm font-semibold tracking-wide text-purple-600 uppercase">
                        Discover Local Trucks
                    </p>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
                        Find Your Next Favorite Food Truck
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Browse every truck currently registered on SkipDaTruck. Tap a truck to jump straight into
                        their live menu and start ordering.
                    </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6 space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">All Food Trucks</h2>
                            <p className="text-sm text-gray-500">
                                {trucks.length} truck{trucks.length === 1 ? '' : 's'} available
                            </p>
                        </div>
                        <a
                            href="/dashboard/merchant/register"
                            className="inline-flex items-center px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                        >
                            Register Your Truck
                        </a>
                    </div>

                    {trucks.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No active trucks yet. Check back soon!
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {trucks.map((truck) => (
                                <Link
                                    key={truck.id}
                                    href={`/t/${truck.id}`}
                                    className="group border border-gray-200 rounded-2xl p-5 bg-white hover:border-purple-300 hover:shadow-lg transition-all duration-200"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                            {truck.name}
                                        </h3>
                                        <Utensils className="w-5 h-5 text-purple-500" />
                                    </div>
                                    {truck.description && (
                                        <p className="text-sm text-gray-600 mb-4">{truck.description}</p>
                                    )}
                                    <div className="flex items-center text-sm text-gray-500 gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>{truck.address}</span>
                                        <span className="text-gray-300">•</span>
                                        <span>{truck.province}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

