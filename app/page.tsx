// Homepage - showcasing the platform
import Link from 'next/link';
import { QrCode, Smartphone, CreditCard, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: QrCode,
      title: 'Scan QR Code',
      description: 'Customers scan your unique QR code to access your menu instantly',
    },
    {
      icon: Smartphone,
      title: 'Mobile Ordering',
      description: 'No app download required - works directly in any mobile browser',
    },
    {
      icon: CreditCard,
      title: 'Instant Payments',
      description: 'Accept Apple Pay, Google Pay, and credit cards with secure processing',
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Real-time order management and analytics to optimize your operations',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
            QR Food Truck Ordering
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            The easiest way for food trucks to accept online orders with zero hassle.
            QR codes • Mobile payments • Real-time orders
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              Merchant Login
            </Link>
            <Link
              href="/signup"
              className="bg-white hover:bg-gray-50 text-purple-600 font-semibold px-8 py-4 rounded-2xl border-2 border-purple-200 hover:border-purple-300 transition-all"
            >
              Sign Up Free
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-lg mb-2">Get Your QR Code</h3>
              <p className="text-gray-600 text-sm">
                Sign up and generate your unique QR code in seconds
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-lg mb-2">Display & Accept Orders</h3>
              <p className="text-gray-600 text-sm">
                Customers scan to order - orders appear in your dashboard instantly
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-lg mb-2">Get Paid</h3>
              <p className="text-gray-600 text-sm">
                Automatic payouts to your account via Stripe Connect
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">Powered by Stripe for secure payments in CAD 🇨🇦</p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span>✓ 4% + $0.10 service fee</span>
            <span>✓ Canadian tax support</span>
            <span>✓ No monthly fees</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2025 QR Food Truck Ordering Platform</p>
          <p className="text-sm mt-2">Built with Next.js, Stripe Connect, and Prisma</p>
        </div>
      </footer>
    </div>
  );
}
