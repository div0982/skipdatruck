'use client';

// QR Code Display Component
import { Download, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface QRCodeDisplayProps {
    qrCodeDataUrl: string;
    truckUrl: string;
    truckName: string;
}

export default function QRCodeDisplay({ qrCodeDataUrl, truckUrl, truckName }: QRCodeDisplayProps) {
    const [copied, setCopied] = useState(false);

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(truckUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleDownloadQR = () => {
        const link = document.createElement('a');
        link.href = qrCodeDataUrl;
        link.download = `${truckName.replace(/\s+/g, '-')}-QR-Code.png`;
        link.click();
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* QR Code Display */}
            <div className="bg-white rounded-xl p-8 border border-gray-200">
                <div className="text-center">
                    <h2 className="text-lg font-bold mb-4">Your QR Code</h2>
                    <div className="inline-block p-6 bg-white rounded-2xl shadow-lg border-2 border-purple-200">
                        <div className="relative w-64 h-64">
                            <Image
                                src={qrCodeDataUrl}
                                alt="QR Code"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadQR}
                        className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Download QR Code
                    </button>
                </div>
            </div>

            {/* Instructions */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4">📍 How to Use</h3>
                    <ol className="space-y-3 text-sm text-gray-700">
                        <li className="flex gap-3">
                            <span className="font-semibold text-purple-600">1.</span>
                            <span>Download the QR code using the button on the left</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-semibold text-purple-600">2.</span>
                            <span>Print it and display it at your food truck</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-semibold text-purple-600">3.</span>
                            <span>Customers scan to view your menu and place orders</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-semibold text-purple-600">4.</span>
                            <span>Receive orders in your dashboard in real-time</span>
                        </li>
                    </ol>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-3">🔗 Direct Link</h3>
                    <p className="text-sm text-gray-600 mb-3">
                        Share this link directly with customers:
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={truckUrl}
                            readOnly
                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                        />
                        <button
                            onClick={handleCopyUrl}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-sm text-purple-800">
                        💡 <strong>Tip:</strong> For best results, print your QR code at least 4x4 inches in size
                        so it's easy to scan from a distance.
                    </p>
                </div>
            </div>
        </div>
    );
}
