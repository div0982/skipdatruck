// QR Code Download Page - Session-based
import { redirect } from 'next/navigation';
import { getUserTruck } from '@/lib/get-user-truck';
import { generateTruckQRCode } from '@/lib/qr-generator';
import QRCodeDisplay from '@/components/dashboard/merchant/QRCodeDisplay';
import { prisma } from '@/lib/db';

export default async function QRCodePage() {
    const truck = await getUserTruck();

    if (!truck) {
        redirect('/dashboard/merchant/register');
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
