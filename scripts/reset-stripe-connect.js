// Reset Stripe Connect Only
// Keeps all other data (trucks, menu items, orders)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetStripeConnect() {
    try {
        console.log('🔄 Resetting Stripe Connect data...\n');

        const result = await prisma.user.updateMany({
            where: {
                OR: [
                    { stripeConnectId: { not: null } },
                    { stripeOnboarded: true }
                ]
            },
            data: {
                stripeConnectId: null,
                stripeOnboarded: false
            }
        });

        console.log(`✅ Reset ${result.count} users`);
        console.log('   - stripeConnectId → NULL');
        console.log('   - stripeOnboarded → false\n');

        console.log('✅ Users can now reconnect to Stripe with the new setup!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetStripeConnect();
