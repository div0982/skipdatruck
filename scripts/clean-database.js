// Database cleanup script - Start Fresh
// This deletes ALL test data

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
    try {
        console.log('🧹 Starting database cleanup...\n');

        // 1. Delete all orders
        console.log('1️⃣  Deleting all orders...');
        const deletedOrders = await prisma.order.deleteMany({});
        console.log(`   ✅ Deleted ${deletedOrders.count} orders\n`);

        // 2. Delete all menu items
        console.log('2️⃣  Deleting all menu items...');
        const deletedMenuItems = await prisma.menuItem.deleteMany({});
        console.log(`   ✅ Deleted ${deletedMenuItems.count} menu items\n`);

        // 3. Delete all food trucks
        console.log('3️⃣  Deleting all food trucks...');
        const deletedTrucks = await prisma.foodTruck.deleteMany({});
        console.log(`   ✅ Deleted ${deletedTrucks.count} food trucks\n`);

        // 4. Reset Stripe Connect data
        console.log('4️⃣  Resetting Stripe Connect data...');
        const updatedUsers = await prisma.user.updateMany({
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
        console.log(`   ✅ Reset ${updatedUsers.count} users\n`);

        console.log('✅ Database cleanup completed!\n');

        // Show remaining counts
        const userCount = await prisma.user.count();
        console.log('📊 Remaining data:');
        console.log(`   Users: ${userCount}`);
        console.log(`   Food Trucks: 0`);
        console.log(`   Menu Items: 0`);
        console.log(`   Orders: 0\n`);
        console.log('✅ Ready for fresh start!');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDatabase();
