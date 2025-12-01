# 🛒 Cart System & Fee Calculation Deep Dive

## Overview

This document provides a comprehensive breakdown of how the cart system works and how all processing fees are calculated in the SkipDaTruck platform.

---

## 📦 Cart System Architecture

### 1. **Cart State Management** (`components/cart/CartProvider.tsx`)

The cart uses **React Context** for global state management across the customer-facing menu page.

#### **Data Structure:**

```typescript
interface CartItem extends MenuItem {
    quantity: number;  // How many of this item
}

interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;     // Price per unit in CAD
    category: string;
    imageUrl: string | null;
}
```

#### **Key Functions:**

- **`addItem(item)`**: Adds 1 quantity of an item (or increments if already in cart)
- **`addToCart(item, quantity)`**: Adds a specific quantity
- **`updateQuantity(itemId, quantity)`**: Updates quantity (removes if quantity ≤ 0)
- **`removeItem(itemId)`**: Removes item completely
- **`clearCart()`**: Empties entire cart

#### **Computed Values:**

```typescript
total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
// Example: Burger $12.99 × 2 = $25.98

itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
// Example: 2 burgers + 1 fries = 3 items
```

**Important:** The `total` in `CartProvider` is **ONLY the subtotal** (sum of item prices × quantities). It does NOT include tax or fees yet.

---

### 2. **Cart Display** (`components/cart/CartDrawer.tsx`)

The cart drawer is a slide-up bottom sheet that shows:
- List of items with quantity controls
- **Price breakdown** (subtotal, fees, tax, total)
- "Proceed to Checkout" button

#### **Fee Calculation in Cart Drawer:**

```typescript
const subtotal = total; // From CartProvider (items only)

// Calculate fees dynamically based on business model
const feeBreakdown = calculateFees(
    subtotal,
    truck.taxRate || 0.13,
    businessModel as BusinessModel
);

const { 
    platformFee,      // Platform service fee
    taxAmount: tax,   // Provincial tax (HST/GST/PST)
    totalPayment: finalTotal,  // Final amount customer pays
    feePercentage     // Fee as % of subtotal
} = feeBreakdown;
```

**Flow:**
1. User adds items → `CartProvider` tracks `subtotal`
2. Cart drawer opens → calls `calculateFees()` with:
   - `subtotal` (from cart)
   - `truck.taxRate` (from truck's province)
   - `businessModel` (from truck owner's settings)
3. Displays breakdown and `finalTotal`

#### **Checkout Flow:**

When user clicks "Proceed to Checkout":
```typescript
sessionStorage.setItem('cart', JSON.stringify({
    items: items.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
    })),
    truckId: truck.id,
    truckName: truck.name,
    province: truck.province,
    taxRate: truck.taxRate,
}));

router.push(`/checkout/${truck.id}`);
```

**Note:** Cart is saved to `sessionStorage` (temporary, cleared on browser close) so checkout page can access it.

---

## 💰 Fee Calculation System (`lib/fee-calculator.ts`)

The platform supports **TWO business models** with different fee structures:

### **Business Model 1: PLATFORM_PAYS_FEES** (Complex Tier System)

**Who pays Stripe fees?** → Platform absorbs all Stripe processing costs

**Platform fee structure:** 3-tier dynamic system

#### **Tier 1: Small Orders ($0 - $8.99)**
```
Platform Fee = $0.65 + (Subtotal × 3.5%)
Example: $5.00 order
  Fee = $0.65 + ($5.00 × 0.035) = $0.65 + $0.175 = $0.825
```

#### **Tier 2: Medium Orders ($9.00 - $24.99)**
```
Platform Fee = $0.40 + (Subtotal × 3.9%)
Example: $15.00 order
  Fee = $0.40 + ($15.00 × 0.039) = $0.40 + $0.585 = $0.985
```

#### **Tier 3: Large Orders ($25.00+)**
```
Platform Fee = $0.05 + (Subtotal × 4.0%)
Example: $50.00 order
  Fee = $0.05 + ($50.00 × 0.040) = $0.05 + $2.00 = $2.05
```

#### **Profit Calculation:**
```typescript
totalPayment = subtotal + tax + platformFee
stripeFee = (totalPayment × 2.9%) + $0.30 CAD
platformProfit = platformFee - stripeFee

// Safety guard: Ensure minimum $0.05 profit
if (platformProfit < 0.05) {
    platformFee += shortfall;
    platformProfit = 0.05;
}
```

**Why this model?**
- Platform takes on risk of Stripe fees
- Higher fees to guarantee profit
- More complex but ensures profitability on all orders

---

### **Business Model 2: MERCHANT_PAYS_FEES** (Simple Commission)

**Who pays Stripe fees?** → Merchant pays Stripe directly

**Platform fee structure:** Simple 3% flat commission

```
Platform Fee = Subtotal × 3%
Example: $50.00 order
  Fee = $50.00 × 0.03 = $1.50
```

#### **Profit Calculation:**
```typescript
totalPayment = subtotal + tax + platformFee
stripeFee = 0  // Merchant pays this separately
platformProfit = platformFee  // Full commission is profit
```

**Why this model?**
- Simpler for merchants to understand
- Lower fees (3% vs 3.5-4%)
- Merchant handles their own Stripe account

---

## 🧮 Complete Calculation Flow

### **Step-by-Step Example: $30 Order in Ontario (13% HST)**

#### **Scenario 1: PLATFORM_PAYS_FEES Model**

```
1. Subtotal: $30.00
   (From cart: items × quantities)

2. Tax Calculation:
   taxRate = 0.13 (Ontario HST)
   tax = $30.00 × 0.13 = $3.90

3. Platform Fee (Tier 3 - Large Order):
   tier = Tier 3 ($25.00+)
   platformFee = $0.05 + ($30.00 × 0.040) = $0.05 + $1.20 = $1.25

4. Total Payment (what customer pays):
   totalPayment = $30.00 + $3.90 + $1.25 = $35.15

5. Stripe Fee (platform absorbs):
   stripeFee = ($35.15 × 0.029) + $0.30 = $1.02 + $0.30 = $1.32

6. Platform Profit:
   platformProfit = $1.25 - $1.32 = -$0.07
   → Safety guard triggers: platformFee adjusted to $1.37
   → Final platformProfit = $0.05

7. Merchant Payout:
   merchantPayout = $30.00 + $3.90 - $1.32 = $32.58
   (Platform keeps $1.37, Stripe takes $1.32, merchant gets $32.58)
```

#### **Scenario 2: MERCHANT_PAYS_FEES Model**

```
1. Subtotal: $30.00

2. Tax Calculation:
   tax = $30.00 × 0.13 = $3.90

3. Platform Fee (3% commission):
   platformFee = $30.00 × 0.03 = $0.90

4. Total Payment (what customer pays):
   totalPayment = $30.00 + $3.90 + $0.90 = $34.80

5. Stripe Fee:
   stripeFee = 0 (merchant pays this separately to Stripe)

6. Platform Profit:
   platformProfit = $0.90 (full commission)

7. Merchant Payout:
   merchantPayout = $30.00 + $3.90 = $33.90
   (Merchant pays Stripe ~$1.01 separately, keeps ~$32.89 net)
```

---

## 🏛️ Tax Calculation (`lib/tax-calculator.ts`)

Tax is calculated **ONLY on the subtotal** (before fees).

### **Canadian Provincial Tax Rates:**

| Province | Tax Type | Rate | Example ($30 order) |
|----------|----------|------|---------------------|
| ON (Ontario) | HST | 13% | $3.90 |
| QC (Quebec) | GST + QST | 14.975% | $4.49 |
| BC (British Columbia) | GST + PST | 12% | $3.60 |
| AB (Alberta) | GST | 5% | $1.50 |
| NS (Nova Scotia) | HST | 15% | $4.50 |

**Formula:**
```typescript
tax = subtotal × PROVINCIAL_TAX_RATES[province]
tax = Math.round(tax * 100) / 100  // Round to 2 decimals
```

**Important:** Tax is **NOT** calculated on platform fees. Only on the food items themselves.

---

## 🔄 Payment Intent Creation (`app/api/payment/create-intent/route.ts`)

When customer reaches checkout, the backend:

1. **Receives cart data:**
   ```json
   {
     "truckId": "xxx",
     "items": [
       { "menuItemId": "yyy", "name": "Burger", "price": 12.99, "quantity": 2 }
     ]
   }
   ```

2. **Fetches truck & owner:**
   - Gets `truck.taxRate` (from province)
   - Gets `owner.businessModel` (PLATFORM_PAYS_FEES or MERCHANT_PAYS_FEES)

3. **Calculates subtotal:**
   ```typescript
   subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
   ```

4. **Calls `calculateFees()`:**
   ```typescript
   const feeBreakdown = calculateFees(subtotal, taxRate, businessModel);
   // Returns: { platformFee, taxAmount, totalPayment, stripeFee, platformProfit, ... }
   ```

5. **Creates Order in database:**
   ```typescript
   Order {
     subtotal: $30.00,
     tax: $3.90,
     platformFee: $1.25,
     total: $35.15,
     status: 'PENDING'
   }
   ```

6. **Creates Stripe PaymentIntent:**
   ```typescript
   PaymentIntent {
     amount: 3515,  // $35.15 in cents
     currency: 'cad',
     metadata: {
       orderId, orderNumber, truckId,
       businessModel, subtotal, tax, platformFee, stripeFee, platformProfit
     }
   }
   ```

7. **If Stripe Connect enabled:**
   - Uses `application_fee_amount` to take platform fee
   - Transfers remaining to merchant's Connect account

---

## 📊 Fee Breakdown Display

### **Cart Drawer Display:**

```
Subtotal:              $30.00
Platform Fee (4.0%):   $1.25
HST:                   $3.90
─────────────────────────────
Total:                 $35.15
```

### **Checkout Page Display:**

Same breakdown, but with tooltip showing:
- Business model explanation
- Fee percentage
- Who pays Stripe fees

---

## 🎯 Key Design Decisions

### **1. Why calculate fees in multiple places?**

- **Cart Drawer:** Shows estimated total before checkout (uses `calculateFees()`)
- **Checkout Page:** Shows final calculated total (from API response)
- **Payment Intent API:** Authoritative calculation (saves to database)

**Why?** Ensures consistency - cart shows estimate, checkout shows final (which might differ slightly due to rounding).

### **2. Why two business models?**

- **PLATFORM_PAYS_FEES:** Better for merchants who don't want to deal with Stripe
- **MERCHANT_PAYS_FEES:** Lower fees, more control for merchants with existing Stripe accounts

### **3. Why tiered fees for PLATFORM_PAYS_FEES?**

- Small orders: Higher fixed fee ($0.65) to cover minimum Stripe costs
- Large orders: Lower fixed fee ($0.05) but higher percentage (4%) for scale
- Ensures platform always makes at least $0.05 profit per order

### **4. Why tax on subtotal only?**

- Standard practice: Tax applies to goods/services, not service fees
- Platform fees are separate from the food items
- Complies with Canadian tax regulations

---

## 🔍 Debugging Fee Calculations

### **Check Console Logs:**

The payment intent API logs:
```javascript
console.log('Payment breakdown:', {
    businessModel,
    subtotal,
    tax,
    platformFee,
    stripeFee,
    merchantPayout,
    platformProfit,
    total
});
```

### **Check Database:**

```sql
SELECT 
    orderNumber,
    subtotal,
    tax,
    platformFee,
    total,
    status
FROM Order
WHERE truckId = 'xxx'
ORDER BY createdAt DESC;
```

### **Check Stripe Dashboard:**

- Payment Intent metadata contains full breakdown
- Application fee shows platform fee amount
- Transfer shows merchant payout

---

## 📝 Summary

1. **Cart System:**
   - React Context manages cart state
   - `subtotal` = sum of (price × quantity) for all items
   - Cart drawer calculates fees dynamically

2. **Fee Calculation:**
   - Two business models with different fee structures
   - PLATFORM_PAYS_FEES: 3-tier system (3.5-4% + fixed fee)
   - MERCHANT_PAYS_FEES: Simple 3% commission
   - Tax calculated on subtotal only (province-specific)

3. **Payment Flow:**
   - Cart → Checkout → Payment Intent API
   - API calculates authoritative fees
   - Stripe PaymentIntent created with full amount
   - Order saved to database with breakdown

4. **Profit Guarantee:**
   - PLATFORM_PAYS_FEES ensures minimum $0.05 profit
   - MERCHANT_PAYS_FEES: Full commission is profit (no Stripe cost)

---

**Last Updated:** Based on current codebase analysis
**Version:** 1.0

