// Quick script to delete/reject a Stripe connected account
// Usage: npx tsx scripts/delete-connected-account.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia',
});

const accountId = 'acct_1SYwsFGwJ8OEojgX';

async function deleteAccount() {
    try {
        console.log(`🗑️  Deleting account: ${accountId}...`);

        // Delete the account
        const deleted = await stripe.accounts.del(accountId);

        if (deleted.deleted) {
            console.log('✅ Account deleted successfully!');
            console.log(`Account ID: ${deleted.id}`);
        }
    } catch (error: any) {
        console.error('❌ Error deleting account:', error.message);
    }
}

deleteAccount();
