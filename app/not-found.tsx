// 404 Not Found Page
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-purple-600 mb-4">404</h1>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
                <p className="text-gray-600 mb-8 max-w-md">
                    Sorry, we couldn't find the page you're looking for.
                </p>
                <Link
                    href="/"
                    className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-2xl transition-colors"
                >
                    Go Back Home
                </Link>
            </div>
        </div>
    );
}
