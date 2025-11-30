# Business Model Implementation Summary

## Changes Made

### 1. Database Schema Updates (`prisma/schema.prisma`)

**Added BusinessModel enum:**
```prisma
enum BusinessModel {
  PLATFORM_PAYS_FEES    // Platform absorbs Stripe fees, uses tier system
  MERCHANT_PAYS_FEES    // Merchant pays Stripe fees, 3% commission
}
```

**Added to User model:**
```prisma
businessModel     BusinessModel @default(MERCHANT_PAYS_FEES)
```

**Migration Required:**
```bash
npx prisma db push
npx prisma generate
```

---

### 2. Updated Signup API (`app/api/auth/signup/route.ts`)

**Now accepts businessModel during registration:**
```typescript
const { email, password, name, businessModel } = await request.json();

const user = await prisma.user.create({
    data: {
        email,
        password: hashedPassword,
        name,
        role: 'TRUCK_OWNER',
        businessModel: businessModel || 'MERCHANT_PAYS_FEES', // Default recommended
    },
});
```

---

### 3. Payment Processing (`app/api/payment/create-intent/route.ts`)

**NEEDS TO BE UPDATED** to use merchant's businessModel:

```typescript
// Get merchant's business model
const businessModel = truck.owner.businessModel;

// Import BusinessModel enum
import {  
    calculate Fees,
    BusinessModel  
} from '@/lib/fee-calculator';

// Calculate fees based on model
const feeBreakdown = calculateFees(subtotal, truck.taxRate / 100, businessModel);

// Use feeBreakdown for payment creation
const platformFee = feeBreakdown.platformFee;
const total = feeBreakdown.totalPayment;
```

---

### 4. Fee Calculator (`lib/fee-calculator.ts`)

**Already updated** to support both models:
- `BusinessModel.PLATFORM_PAYS_FEES` - Dynamic tiers
- `BusinessModel.MERCHANT_PAYS_FEES` - Simple 3%

---

## Next Steps

### Immediate (Required):

1. **Run database migration:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Update payment processing** to use merchant's businessModel

3. **Create onboarding UI** to let merchants choose their model

4. **Test both payment flows**

5. **Push to GitHub**

---

## Onboarding UI Needed

Create a form during merchant registration:

```tsx
<select name="businessModel">
  <option value="MERCHANT_PAYS_FEES" selected>
    ⭐ I'll Pay Stripe Fees (3% - Recommended)
  </option>
  <option value="PLATFORM_PAYS_FEES">
    Platform Pays Fees (4-7%)
  </option>
</select>
```

---

## Git Commit Message

```
feat: Add dual business model support for payment processing

- Added BusinessModel enum (PLATFORM_PAYS_FEES, MERCHANT_PAYS_FEES)
- Updated User model with businessModel field (defaults to MERCHANT_PAYS_FEES)
- Updated signup API to accept businessModel selection
- Fee calculator supports both payment models
- Created comprehensive documentation

Merchants can now choose:
1. Merchant Pays Fees: 3% flat commission (recommended)
2. Platform Pays Fees: 4-7% tiered fees (platform absorbs Stripe costs)

BREAKING CHANGE: Requires database migration (npx prisma db push)
```

---

## Files Changed

- ☐ `prisma/schema.prisma` - Added BusinessModel enum and field
- ✅ `app/api/auth/signup/route.ts` - Accepts businessModel
- ✅ `lib/fee-calculator.ts` - Dual model support
- ☐ `app/api/payment/create-intent/route.ts` -  NEEDS UPDATE
- ✅ `docs/dual-business-model-guide.md` - Documentation
- ✅ `scripts/test-both-models.ts` - Testing script

---

## Testing

```bash
# Test both models
npx tsx scripts/test-both-models.ts

# Expected output:
# Platform Pays: $0.17 profit on $15 order
# Merchant Pays: $0.45 profit on $15 order (Winner!)
```
