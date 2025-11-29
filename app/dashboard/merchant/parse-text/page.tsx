'use client';

import { useState, useEffect, Suspense } from 'react';
import { Loader2, CheckCircle, XCircle, Type, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ExtractedItem {
    name: string;
    description: string;
    price: number;
    category: string;
}

function TextMenuParserContent() {
    const router = useRouter();
    const [menuText, setMenuText] = useState('');
    const [parsing, setParsing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [truckId, setTruckId] = useState<string | null>(null);

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

    const handleParse = async () => {
        if (!menuText.trim()) {
            setError('Please enter menu text');
            return;
        }

        setError(null);
        setParsing(true);
        setExtractedItems([]);

        try {
            const response = await fetch('/api/parse-menu-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menuText }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.details
                    ? `${data.error || 'Failed to parse menu text'}: ${data.details}`
                    : data.error || 'Failed to parse menu text';
                throw new Error(errorMsg);
            }

            setExtractedItems(data.items);
            setParsing(false);
        } catch (err: any) {
            setError(err.message);
            setParsing(false);
        }
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold gradient-text mb-4 flex items-center justify-center gap-3">
                        <Sparkles className="w-10 h-10" />
                        ✨ AI Text Menu Parser
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Paste your menu text and let AI format it beautifully
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Type className="w-6 h-6 text-purple-600" />
                            Paste Menu Text
                        </h2>

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
                            className="w-full h-[400px] p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-400 focus:outline-none font-mono text-sm resize-none"
                            disabled={parsing}
                        />

                        <button
                            onClick={handleParse}
                            disabled={parsing || !menuText.trim()}
                            className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {parsing ? (
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

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-red-900">Parsing Failed</p>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                        <h2 className="text-2xl font-bold mb-6">Parsed Items</h2>

                        {!truckId ? (
                            <div className="text-center py-12">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-4">
                                    <p className="text-yellow-800 font-medium mb-2">
                                        No truck registered
                                    </p>
                                    <p className="text-sm text-yellow-700 mb-4">
                                        You need to register a food truck before parsing menu items.
                                    </p>
                                    <a
                                        href="/dashboard/merchant/register"
                                        className="inline-block px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-all"
                                    >
                                        Register Food Truck
                                    </a>
                                </div>
                            </div>
                        ) : extractedItems.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p className="text-lg">No items parsed yet</p>
                                <p className="text-sm mt-2">Paste menu text and click Parse</p>
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
                                    disabled={success || saving || !truckId}
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
            </div>
        </div>
    );
}

export default function TextMenuParserPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
            </div>
        }>
            <TextMenuParserContent />
        </Suspense>
    );
}
