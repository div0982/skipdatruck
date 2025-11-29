'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Type, Loader2, CheckCircle, XCircle, Image as ImageIcon, Sparkles, ArrowLeft } from 'lucide-react';

interface ExtractedItem {
    name: string;
    description: string;
    price: number;
    category: string;
}

type UploadMode = 'image' | 'text' | null;

function MenuUploadContent() {
    const router = useRouter();
    const [truckId, setTruckId] = useState<string | null>(null);
    const [mode, setMode] = useState<UploadMode>(null);
    const [uploading, setUploading] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [menuText, setMenuText] = useState('');
    const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Fetch user's truck from API (session-based)
        async function fetchTruck() {
            try {
                const response = await fetch('/api/user/truck');
                if (response.ok) {
                    const truck = await response.json();
                    setTruckId(truck.id);
                } else {
                    setError('No truck found. Please register a truck first.');
                }
            } catch (err) {
                setError('Failed to load truck. Please try again.');
            }
        }
        fetchTruck();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        setError(null);
        setUploading(true);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        const base64 = await fileToBase64(file);
        setUploading(false);
        setExtracting(true);

        try {
            const response = await fetch('/api/extract-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: base64 }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to extract menu items');
            }

            setExtractedItems(data.items);
            setExtracting(false);
        } catch (err: any) {
            setError(err.message || 'Failed to extract menu items');
            setExtracting(false);
        }
    };

    const handleTextParse = async () => {
        if (!menuText.trim()) {
            setError('Please enter menu text');
            return;
        }

        setError(null);
        setExtracting(true);

        try {
            const response = await fetch('/api/parse-menu-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menuText }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to parse menu text');
            }

            setExtractedItems(data.items);
            setExtracting(false);
        } catch (err: any) {
            setError(err.message || 'Failed to parse menu text');
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
        if (!truckId) {
            setError('Missing truckId. Cannot save items.');
            return;
        }

        if (extractedItems.length === 0) {
            setError('No items to save');
            return;
        }

        setError(null);
        setSaving(true);

        try {
            const response = await fetch('/api/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    truckId,
                    items: extractedItems,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to save menu items');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push(`/dashboard/merchant?truckId=${truckId}`);
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to save items');
            setSaving(false);
        }
    };

    if (!truckId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                        <p className="text-yellow-800 text-center mb-4">
                            No truck registered. Please register a truck first.
                        </p>
                        <a
                            href="/dashboard/merchant/register"
                            className="block w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-all text-center"
                        >
                            Register Food Truck
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <a
                        href={`/dashboard/merchant?truckId=${truckId}`}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </a>
                    <div className="text-center">
                        <h1 className="text-4xl font-bold gradient-text mb-4 flex items-center justify-center gap-3">
                            <Sparkles className="w-10 h-10" />
                            Add Menu Items
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Upload a menu image or paste text - AI will extract everything automatically
                        </p>
                    </div>
                </div>

                {!mode ? (
                    // Mode Selection
                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <button
                            onClick={() => setMode('image')}
                            className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200 hover:border-purple-400 hover:shadow-2xl transition-all text-left group"
                        >
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                                <ImageIcon className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Menu Image</h3>
                            <p className="text-gray-600">
                                Take a photo or upload an image of your menu. AI will extract all items automatically.
                            </p>
                        </button>

                        <button
                            onClick={() => setMode('text')}
                            className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200 hover:border-blue-400 hover:shadow-2xl transition-all text-left group"
                        >
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                                <Type className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Paste Menu Text</h3>
                            <p className="text-gray-600">
                                Copy and paste your menu text. AI will format it into structured menu items.
                            </p>
                        </button>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Input Section */}
                        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    {mode === 'image' ? (
                                        <>
                                            <ImageIcon className="w-6 h-6 text-purple-600" />
                                            Upload Menu Image
                                        </>
                                    ) : (
                                        <>
                                            <Type className="w-6 h-6 text-blue-600" />
                                            Paste Menu Text
                                        </>
                                    )}
                                </h2>
                                <button
                                    onClick={() => {
                                        setMode(null);
                                        setImagePreview(null);
                                        setMenuText('');
                                        setExtractedItems([]);
                                        setError(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    Change Method
                                </button>
                            </div>

                            {mode === 'image' ? (
                                <>
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
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setImagePreview(null);
                                                    setExtractedItems([]);
                                                }}
                                                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                                            >
                                                Upload Different Image
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <textarea
                                        value={menuText}
                                        onChange={(e) => setMenuText(e.target.value)}
                                        placeholder="Paste your menu here...

Example:
Burger - $12.99
Delicious beef burger with fries

Pizza Margherita - $15.99
Classic Italian pizza

Fries - $4.99"
                                        className="w-full h-[400px] p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-400 focus:outline-none font-mono text-sm resize-none"
                                        disabled={extracting}
                                    />
                                    <button
                                        onClick={handleTextParse}
                                        disabled={extracting || !menuText.trim()}
                                        className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {extracting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Parsing with AI...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Parse Menu with AI
                                            </>
                                        )}
                                    </button>
                                </>
                            )}

                            {error && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-red-900">Error</p>
                                        <p className="text-sm text-red-700 mt-1">{error}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Results Section */}
                        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                            <h2 className="text-2xl font-bold mb-6">Extracted Items</h2>

                            {extractedItems.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <p className="text-lg">No items extracted yet</p>
                                    <p className="text-sm mt-2">
                                        {mode === 'image' ? 'Upload a menu image to get started' : 'Paste menu text and click Parse'}
                                    </p>
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
                                                        ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
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
                                        disabled={success || saving}
                                        className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Saving...
                                            </>
                                        ) : success ? (
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
                )}
            </div>
        </div>
    );
}

export default function MenuUploadPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
            </div>
        }>
            <MenuUploadContent />
        </Suspense>
    );
}
