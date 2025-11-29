# 🍽️ QR Food Truck Ordering Platform

A complete full-stack web application for food trucks to accept online orders via QR codes, with support for Apple Pay, Google Pay, and credit cards. Built with Next.js 14, Stripe Connect, and Prisma.

## ✨ Features

### For Customers
- **QR Code Ordering**: Scan a QR code to instantly access a food truck's menu
- **Mobile-First Design**: Beautiful, responsive interface optimized for smartphones
- **Multiple Payment Options**: Apple Pay, Google Pay, and credit card support via Stripe
- **Real-Time Order Tracking**: Live status updates (Pending → Preparing → Ready)
- **Transparent Pricing**: Clear breakdown of subtotal, tax, and service fees

### For Merchants
- **Live Order Management**: Real-time order feed with status controls
- **QR Code Generation**: Downloadable QR codes for easy customer access
- **Dashboard Analytics**: Today's orders, revenue, and performance metrics
- **Stripe Connect Payouts**: Automatic payment processing with direct deposits
- **Menu Management**: Easy-to-use interface for managing menu items

### For Platform
- **Admin Dashboard**: Overview of all trucks, orders, and platform revenue
- **Canadian Tax Support**: Automatic HST/GST/PST/QST calculation by province
- **Platform Fees**: 4% + $0.10 CAD per order with transparent accounting

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe Connect Express
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Custom-built with lucide-react icons

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account with Connect platform enabled
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd c:\Users\Divesh\Desktop\payment
npm install
```

### 2. Setup Environment Variables

Copy the template and fill in your credentials:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/foodtruck_db"

# Stripe (Get from https://dashboard.stripe.com)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Setup Database

```bash
# Push Prisma schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

## 📱 Demo URLs

After seeding the database, you can test these pages:

- **Homepage**: http://localhost:3000
- **Customer Menu** (Miguel's Tacos): http://localhost:3000/t/demo-truck-1
- **Merchant Dashboard**: http://localhost:3000/dashboard/merchant?truckId=demo-truck-1
- **Admin Dashboard**: http://localhost:3000/dashboard/admin
- **QR Code**: http://localhost:3000/dashboard/merchant/qr?truckId=demo-truck-1

## 💳 Payment Flow

### Customer Journey
1. Scan QR code → Land on truck's menu page
2. Browse menu → Add items to cart
3. Proceed to checkout → See pricing breakdown:
   - Subtotal
   - Tax (based on province)
   - Platform Fee (4% + $0.10 CAD)
   - Total
4. Pay with Apple Pay / Google Pay / Card
5. Receive order confirmation
6. Track order status in real-time

### Merchant Journey
1. Order appears in live dashboard
2. Click "Start Preparing" → Customer sees "Preparing"
3. Click "Mark as Ready" → Customer notified
4. Click "Complete Order" → Order archived

### Payment Processing
- Customer pays total amount (including platform fee)
- Stripe Connect automatically:
  - Transfers `subtotal + tax - Stripe fee` to merchant
  - Transfers `platform fee` to platform account
- Merchant receives payout per Stripe Connect schedule

## 🇨🇦 Canadian Tax Rates

The platform automatically applies the correct tax rate based on the truck's province:

| Province | Tax | Rate |
|----------|-----|------|
| Ontario (ON) | HST | 13% |
| Quebec (QC) | GST + QST | 14.975% |
| British Columbia (BC) | GST + PST | 12% |
| Alberta (AB) | GST | 5% |
| Nova Scotia (NS) | HST | 15% |

*See `lib/tax-calculator.ts` for complete list*

## 🎨 Design Features

- **Gradient Theme**: Purple accent colors with smooth gradients
- **Glassmorphism**: Modern UI with backdrop blur effects
- **Smooth Animations**: Subtle micro-interactions
- **Mobile-Optimized**: iOS-style bottom navigation and safe areas
- **Skeleton Loaders**: Loading states for better UX
- **Dark Mode Ready**: CSS variables system for easy theming

## 📂 Project Structure

```
payment/
├── app/
│   ├── api/              # API routes
│   │   ├── connect/      # Stripe Connect onboarding
│   │   ├── menu/         # Menu management
│   │   ├── orders/       # Order CRUD
│   │   ├── payment/      # Payment intent creation
│   │   ├── trucks/       # Truck management
│   │   └── webhooks/     # Stripe webhooks
│   ├── checkout/         # Checkout page
│   ├── dashboard/
│   │   ├── admin/        # Admin dashboard
│   │   └── merchant/     # Merchant dashboard
│   ├── order/            # Order confirmation & tracking
│   ├── t/                # QR landing pages (per truck)
│   └── globals.css       # Global styles
├── components/
│   ├── cart/             # Shopping cart
│   ├── checkout/         # Checkout components
│   ├── dashboard/        # Dashboard components
│   ├── menu/             # Menu browser & items
│   ├── order/            # Order details & tracking
│   └── truck/            # Truck header
├── lib/
│   ├── db.ts             # Prisma client
│   ├── fee-calculator.ts # Platform fee logic
│   ├── qr-generator.ts   # QR code generation
│   ├── stripe.ts         # Stripe client
│   ├── tax-calculator.ts # Canadian tax rates
│   └── utils.ts          # Helpers
├── prisma/
│   ├── schema.prisma     # Database models
│   └── seed.ts           # Demo data
└── package.json
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed demo data
```

## 🔐 Stripe Setup

### 1. Create Stripe Connect Platform

1. Go to https://dashboard.stripe.com/connect/overview
2. Enable Connect (choose Express for merchants)
3. Configure platform settings

### 2. Get API Keys

1. Get publishable and secret keys from https://dashboard.stripe.com/test/apikeys
2. Add to `.env` file

### 3. Setup Webhooks

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. Copy webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`

### 4. Test Cards

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- More: https://stripe.com/docs/testing

## 🍎 Apple Pay Testing

Apple Pay requires:
1. HTTPS connection (use ngrok for local dev)
2. Valid domain verification
3. Safari browser (iOS or macOS)

```bash
# Use ngrok for HTTPS
ngrok http 3000

# Update NEXT_PUBLIC_APP_URL in .env with ngrok URL
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

### Database

Use a managed PostgreSQL service:
- [Supabase](https://supabase.com) (Recommended)
- [Neon](https://neon.tech)
- [Railway](https://railway.app)

## 📝 Note on Authentication

This demo uses simplified authentication (truck ID in query params). For production:

1. Implement proper authentication (NextAuth.js, Clerk, etc.)
2. Add protected routes
3. Store user sessions
4. Add role-based access control

## 🐛 Troubleshooting

**Issue: Database connection error**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Run `npm run db:push`

**Issue: Stripe 401 error**
- Check API keys are correct
- Ensure you're using test keys in development
- Verify keys match the Stripe account

**Issue: TypeScript errors**
- Run `npm install` to ensure all types are installed
- Clear `.next` folder and rebuild

## 📄 License

This project is provided as-is for educational and commercial use.

## 🙏 Acknowledgments

- Stripe for payment processing
- Next.js team for the amazing framework
- Prisma for database tooling

---

**Built with ❤️ for food truck entrepreneurs**
