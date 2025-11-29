// QR Code Generator
import QRCode from 'qrcode';

/**
 * Generate QR code as data URL
 * @param truckId - Food truck ID
 * @param baseUrl - Base app URL (e.g., https://myapp.com)
 * @returns Data URL of QR code image
 */
export async function generateTruckQRCode(truckId: string, baseUrl: string): Promise<string> {
    const url = `${baseUrl}/t/${truckId}`;

    try {
        const qrDataUrl = await QRCode.toDataURL(url, {
            width: 512,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        return qrDataUrl;
    } catch (error) {
        console.error('Failed to generate QR code:', error);
        throw new Error('QR code generation failed');
    }
}

/**
 * Generate QR code as buffer (for PDF generation)
 */
export async function generateTruckQRCodeBuffer(truckId: string, baseUrl: string): Promise<Buffer> {
    const url = `${baseUrl}/t/${truckId}`;

    try {
        const qrBuffer = await QRCode.toBuffer(url, {
            width: 512,
            margin: 2,
        });

        return qrBuffer;
    } catch (error) {
        console.error('Failed to generate QR code buffer:', error);
        throw new Error('QR code generation failed');
    }
}
