// QR Code Download Page
import { prisma } from '@/lib/db';
import { generateTruckQRCode } from '@/lib/qr-generator';
import QRCodeDisplay from '@/components/dashboard/merchant/QRCodeDisplay';

export default async function QRCodePage({ searchParams }: {
    searchParams: Promise<{ truckId?: string }>
}) {
    const params = await searchParams;
    
    if (!params.truckId) {
        return <div>Missing truckId</div>;
    }

    const truck = await prisma.foodTruck.findUnique({
        where: { id: params.truckId },
    });

    if (!truck) {
        return <div>Truck not found</div>;
    }

    // Generate QR code
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const qrCodeDataUrl = await generateTruckQRCode(truck.id, baseUrl);
    const truckUrl = `${baseUrl}/t/${truck.id}`;

    // Update truck with QR code if not exists
    if (!truck.qrCodeUrl) {
        await prisma.foodTruck.update({
            where: { id: truck.id },
            data: { qrCodeUrl: qrCodeDataUrl },
        });
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <h1 className="text-2xl font-bold text-gray-900">QR Code</h1>
                    <p className="text-sm text-gray-600">{truck.name}</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                <QRCodeDisplay
                    qrCodeDataUrl={qrCodeDataUrl}
                    truckUrl={truckUrl}
                    truckName={truck.name}
                />
            </div>
        </div>
    );
}
