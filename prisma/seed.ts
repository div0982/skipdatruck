// Database seed script for testing
import { PrismaClient, Province } from '@prisma/client';
import { getTaxRate } from '../lib/tax-calculator';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const admin = await prisma.user.upsert({
        where: { email: 'admin@foodtruck.com' },
        update: {},
        create: {
            email: 'admin@foodtruck.com',
            password: 'hashed_password_here', // In production, use bcrypt
            role: 'ADMIN',
            name: 'Admin User',
        },
    });

    console.log('✓ Created admin user');

    // Create truck owner
    const owner = await prisma.user.upsert({
        where: { email: 'owner@tacos.com' },
        update: {},
        create: {
            email: 'owner@tacos.com',
            password: 'hashed_password_here',
            role: 'TRUCK_OWNER',
            name: 'Taco Truck Owner',
            stripeConnectId: 'acct_test_123', // Placeholder
            stripeOnboarded: true,
        },
    });

    console.log('✓ Created truck owner');

    // Create food truck
    const truck = await prisma.foodTruck.upsert({
        where: { id: 'demo-truck-1' },
        update: {},
        create: {
            id: 'demo-truck-1',
            ownerId: owner.id,
            name: "Miguel's Tacos",
            description: 'Authentic Mexican street tacos made fresh daily',
            address: '123 Food Truck Lane, Toronto, ON',
            province: Province.ON,
            taxRate: getTaxRate(Province.ON),
            logoUrl: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400',
            bannerUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200',
            isActive: true,
        },
    });

    console.log('✓ Created food truck');

    // Create menu items
    const menuItems = [
        {
            truckId: truck.id,
            name: 'Classic Beef Taco',
            description: 'Seasoned ground beef, lettuce, cheese, salsa',
            price: 4.99,
            category: 'Tacos',
            imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
            isAvailable: true,
            sortOrder: 1,
        },
        {
            truckId: truck.id,
            name: 'Spicy Chicken Taco',
            description: 'Grilled chicken, jalapeños, cilantro, lime',
            price: 5.49,
            category: 'Tacos',
            imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
            isAvailable: true,
            sortOrder: 2,
        },
        {
            truckId: truck.id,
            name: 'Fish Taco',
            description: 'Beer-battered fish, cabbage slaw, chipotle mayo',
            price: 6.99,
            category: 'Tacos',
            imageUrl: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=400',
            isAvailable: true,
            sortOrder: 3,
        },
        {
            truckId: truck.id,
            name: 'Nachos Supreme',
            description: 'Tortilla chips, cheese, jalapeños, sour cream, guacamole',
            price: 8.99,
            category: 'Sides',
            imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400',
            isAvailable: true,
            sortOrder: 4,
        },
        {
            truckId: truck.id,
            name: 'Churros',
            description: 'Fried dough pastry with cinnamon sugar',
            price: 4.49,
            category: 'Desserts',
            imageUrl: 'https://images.unsplash.com/photo-1600626336187-05a57bbc5e66?w=400',
            isAvailable: true,
            sortOrder: 5,
        },
        {
            truckId: truck.id,
            name: 'Horchata',
            description: 'Sweet rice milk with cinnamon',
            price: 3.99,
            category: 'Drinks',
            imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
            isAvailable: true,
            sortOrder: 6,
        },
    ];

    for (const item of menuItems) {
        await prisma.menuItem.upsert({
            where: { id: `menu-${item.name.replace(/\s+/g, '-').toLowerCase()}` },
            update: {},
            create: {
                id: `menu-${item.name.replace(/\s+/g, '-').toLowerCase()}`,
                ...item,
            },
        });
    }

    console.log('✓ Created menu items');

    // Create sample customer
    const customer = await prisma.user.upsert({
        where: { email: 'customer@example.com' },
        update: {},
        create: {
            email: 'customer@example.com',
            password: 'hashed_password_here',
            role: 'CUSTOMER',
            name: 'John Customer',
        },
    });

    console.log('✓ Created customer');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📝 Demo Data:');
    console.log(`   Truck: ${truck.name}`);
    console.log(`   Truck ID: ${truck.id}`);
    console.log(`   Menu Items: ${menuItems.length}`);
    console.log(`\n🔗 Try it out:`);
    console.log(`   Customer: http://localhost:3000/t/${truck.id}`);
    console.log(`   Merchant: http://localhost:3000/dashboard/merchant?truckId=${truck.id}`);
    console.log(`   Admin: http://localhost:3000/dashboard/admin`);
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
