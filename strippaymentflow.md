# Walkthrough - Stripe Payment Flow Refactoring

## Summary

Successfully refactored the Stripe payment flow to optimize how fees are calculated and charged. The new model ensures:
- Customer pays: `subtotal + tax + platformFee`
- Stripe processing fee applies to the **merchant's portion** (`subtotal + tax`)
- Merchant receives: [(subtotal + tax) - stripeFee](file:///c:/Users/Divesh/Desktop/payment/app/api/payment/create-intent/route.ts#17-170)
- Platform receives the full platform fee without Stripe taking a cut

## Changes Made

### Fee Calculator Functions

Updated [fee-calculator.ts](file:///c:/Users/Divesh/Desktop/payment/lib/fee-calculator.ts) with two new functions:

**[calculateStripeFee(subtotal, tax)](file:///c:/Users/Divesh/Desktop/payment/lib/fee-calculator.ts#15-27)**
```typescript
export function calculateStripeFee(subtotal: number, tax: number): number {
    const merchantPortion = subtotal + tax;
    const fee = (merchantPortion * 0.029) + 0.30;
    return Math.round(fee * 100) / 100;
}
```
Calculates Stripe's 2.9% + $0.30 fee based on the merchant's portion (subtotal + tax).

**[calculateMerchantPayout(subtotal, tax)](file:///c:/Users/Divesh/Desktop/payment/lib/fee-calculator.ts#28-40)**
```typescript
export function calculateMerchantPayout(subtotal: number, tax: number): number {
    const stripeFee = calculateStripeFee(subtotal, tax);
    const payout = (subtotal + tax) - stripeFee;
    return Math.round(payout * 100) / 100;
}
```
Calculates what the merchant actually receives after Stripe fees are deducted.

### Payment Intent Creation

Updated [route.ts](file:///c:/Users/Divesh/Desktop/payment/app/api/payment/create-intent/route.ts#L1-L175) to implement the new payment model:

1. **Calculate all fees**:
   - Platform fee (4% + $0.10 on subtotal only)
   - Stripe fee (2.9% + $0.30 on merchant portion: subtotal + tax)
   - Merchant payout (subtotal + tax - Stripe fee)

2. **PaymentIntent configuration**:
   - `amount`: Customer pays full total (subtotal + tax + platform fee)
   - `application_fee_amount`: Platform fee (Stripe doesn't charge fees on this)
   - `transfer_data.amount`: Merchant receives payout after Stripe fees

3. **Added validation**: Ensures `merchantPayout + platformFee + stripeFee ≤ total`

4. **Enhanced metadata**: Stores all breakdown values for auditing

## Verification

**Example calculation** (using $15 subtotal, 13% tax):

| Item | Calculation | Amount |
|------|-------------|--------|
| Subtotal | Order items | $15.00 |
| Tax (13%) | $15.00 × 0.13 | $1.95 |
| **Merchant Portion** | **$15.00 + $1.95** | **$16.95** |
| Platform Fee | ($15.00 × 0.04) + $0.10 | $0.70 |
| Stripe Fee | ($16.95 × 0.029) + $0.30 | $0.79 |
| **Customer Pays** | $15.00 + $1.95 + $0.70 | **$17.65** |
| **Merchant Receives** | $16.95 - $0.79 | **$16.16** |
| **Platform Receives** | Application fee | **$0.70** |
| **Stripe Receives** | From merchant portion | **$0.79** |

**Money flow validation**:
- Merchant: $16.16
- Platform: $0.70
- Stripe: $0.79
- **Total**: $16.16 + $0.70 + $0.79 = **$17.65** ✓

## Benefits

1. **Platform fee optimization**: Stripe doesn't charge fees on the platform fee ($0.70), saving you ~$0.02 per transaction
2. **Standard Stripe behavior**: Stripe charges their normal 2.9% + $0.30 on the merchant's earnings (subtotal + tax)
3. **Transparent fee structure**: All fees are clearly calculated and tracked in metadata
4. **Proper separation**: Platform fee is handled through `application_fee_amount`, ensuring clean accounting
5. **Validation**: Built-in checks prevent incorrect fee configurations