'use client';

import { useState } from 'react';
import { Upload, Loader2, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ExtractedItem {
    name: string;
    description: string;
    price: number;
    category: string;
}

export default function MenuUploadPage() {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        setError(null);
        setUploading(true);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Convert to base64 for API
        const base64 = await fileToBase64(file);

        setUploading(false);
        setExtracting(true);

        try {
            // Call the extraction API
            const response = await fetch('/api/extract-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: base64 }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to extract menu items');
            }

            setExtractedItems(data.items);
            setExtracting(false);
        } catch (err: any) {
            setError(err.message);
            setExtracting(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleSaveItems = async () => {
        // TODO: Save to database via API
        setSuccess(true);
        setTimeout(() => {
            router.push('/dashboard/merchant');
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold gradient-text mb-4">
                        📸 AI Menu Upload
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Upload a photo of your menu and let AI extract all items automatically
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Upload className="w-6 h-6 text-purple-600" />
                            Upload Menu Photo
                        </h2>

                        {!imagePreview ? (
                            <label className="block border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploading || extracting}
                                />
                                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600 font-medium mb-2">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-sm text-gray-400">
                                    PNG, JPG, JPEG up to 10MB
                                </p>
                            </label>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200">
                                    <img
                                        src={imagePreview}
                                        alt="Menu preview"
                                        className="w-full h-auto"
                                    />
                                    {extracting && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="bg-white rounded-2xl p-6 text-center">
                                                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-3" />
                                                <p className="font-medium text-gray-900">Extracting menu items...</p>
                                                <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setImagePreview(null);
                                        setExtractedItems([]);
                                        setError(null);
                                    }}
                                    className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                                >
                                    Upload Different Image
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-red-900">Extraction Failed</p>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Extracted Items Section */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                        <h2 className="text-2xl font-bold mb-6">Extracted Items</h2>

                        {extractedItems.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p className="text-lg">No items extracted yet</p>
                                <p className="text-sm mt-2">Upload a menu image to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <p className="font-medium text-green-900">
                                        Found {extractedItems.length} items!
                                    </p>
                                </div>

                                <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                                    {extractedItems.map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900">{item.name}</h3>
                                                <span className="text-purple-600 font-bold">
                                                    ${item.price.toFixed(2)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                                {item.category}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleSaveItems}
                                    disabled={success}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {success ? (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Saved Successfully!
                                        </>
                                    ) : (
                                        'Save All Items to Menu'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
