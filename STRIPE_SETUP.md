# Stripe Setup Guide for Food Truck Platform

This guide will help you set up Stripe for payment processing in your food truck platform.

## Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Sign up" and create a free account
3. Complete the account setup (you can use test mode for development)

## Step 2: Get Your API Keys

### For Test Mode (Sandbox):

1. Log in to your Stripe Dashboard
2. Make sure you're in **Test mode** (toggle in the top right)
3. Go to **Developers** → **API keys**
4. Copy your keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"

### For Production:

1. Switch to **Live mode** in Stripe Dashboard
2. Go to **Developers** → **API keys**
3. Copy your live keys (starts with `pk_live_...` and `sk_live_...`)

## Step 3: Set Up Stripe Connect (For Multi-Vendor Platform)

Since this is a platform where multiple food trucks accept payments, you need Stripe Connect:

### Option A: Express Accounts (Recommended for Quick Setup)

1. In Stripe Dashboard, go to **Connect** → **Settings**
2. Enable **Express accounts**
3. Set up your Connect settings:
   - **Application fee**: This is handled in code (4% + $0.10)
   - **Branding**: Customize how the onboarding looks

### Option B: Standard Accounts (More Control)

1. Go to **Connect** → **Settings**
2. Enable **Standard accounts**
3. Configure account requirements

## Step 4: Configure Your Environment Variables

Add these to your `.env` file:

```env
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY="sk_test_YOUR_SECRET_KEY_HERE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_PUBLISHABLE_KEY_HERE"

# Stripe Webhook Secret (for production - get from webhook settings)
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET_HERE"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Step 5: Set Up Stripe Connect for Food Truck Owners

### For Testing Without Full Connect Setup:

You can temporarily modify the payment API to work without Stripe Connect by:

1. Creating a test connected account in Stripe Dashboard:
   - Go to **Connect** → **Accounts**
   - Click **Create account**
   - Choose **Express** account
   - Complete the test onboarding
   - Copy the account ID (starts with `acct_...`)

2. Update your database:
   ```sql
   UPDATE User SET 
     stripeConnectId = 'acct_YOUR_CONNECTED_ACCOUNT_ID',
     stripeOnboarded = true
   WHERE email = 'demo@example.com';
   ```

### For Production:

Food truck owners will need to:
1. Go through Stripe Connect onboarding
2. Provide business information
3. Link their bank account
4. Complete identity verification

## Step 6: Test Payments

### Test Card Numbers:

Use these test cards in Stripe test mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

**Expiry**: Any future date (e.g., 12/34)
**CVC**: Any 3 digits (e.g., 123)
**ZIP**: Any 5 digits (e.g., 12345)

## Step 7: Set Up Webhooks (For Production)

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
   - `charge.failed`
5. Copy the webhook signing secret

## Step 8: Testing the Payment Flow

1. Start your development server: `npm run dev`
2. Navigate to a food truck menu: `http://localhost:3000/t/[truck-id]`
3. Add items to cart
4. Click "Proceed to Checkout"
5. Use test card `4242 4242 4242 4242` to complete payment
6. Check Stripe Dashboard → **Payments** to see the transaction

## Troubleshooting

### "This truck is not set up to accept payments"

- Make sure the user has `stripeConnectId` and `stripeOnboarded = true` in the database
- For testing, you can manually set these values

### "Invalid API Key"

- Check that your `.env` file has the correct keys
- Make sure you're using test keys in development
- Restart your dev server after changing `.env`

### Payment Intent Creation Fails

- Check Stripe Dashboard → **Logs** for error details
- Verify your Stripe account is active
- Make sure you have sufficient API access

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Connect Guide](https://stripe.com/docs/connect)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe API Reference](https://stripe.com/docs/api)

## Quick Test Setup (Without Connect)

If you want to test payments without setting up Connect accounts, you can temporarily modify `/app/api/payment/create-intent/route.ts` to skip the Connect check:

```typescript
// Comment out or modify this check:
// if (!truck.owner.stripeConnectId || !truck.owner.stripeOnboarded) {
//     return NextResponse.json(
//         { error: 'This truck is not set up to accept payments' },
//         { status: 400 }
//     );
// }

// And remove the Connect-specific fields from payment intent:
const paymentIntent = await stripe.paymentIntents.create({
    amount: toStripeCents(total),
    currency: 'cad',
    // Remove these lines for non-Connect testing:
    // application_fee_amount: toStripeCents(platformFee),
    // transfer_data: {
    //     destination: truck.owner.stripeConnectId,
    // },
    metadata: {
        orderId: order.id,
        orderNumber,
        truckId,
        truckName: truck.name,
    },
    automatic_payment_methods: {
        enabled: true,
    },
});
```

**Note**: This is only for testing. For production, you'll need proper Stripe Connect setup.

