// Quick script to delete Stripe connected account
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const accountId = 'acct_1SYwsFGwJ8OEojgX';

async function deleteAccount() {
    try {
        console.log(`🗑️  Deleting account: ${accountId}...`);

        const deleted = await stripe.accounts.del(accountId);

        if (deleted.deleted) {
            console.log('✅ Account deleted successfully!');
            console.log(`Account ID: ${deleted.id}`);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

deleteAccount();
