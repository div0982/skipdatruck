
import { PrismaClient } from '@prisma/client';

// Hardcoded for this script only
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:Springtime%402025@db.hshsxbfbtecbixrchros.supabase.co:5432/postgres?sslmode=require',
        },
    },
});

async function main() {
    const email = 'linglangfake@gmail.com';

    console.log(`Looking for user with email: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log(`Found user: ${user.name} (${user.id})`);
    // @ts-ignore
    console.log(`Current business model: ${user.businessModel}`);

    const updatedUser = await prisma.user.update({
        where: { email },
        data: {
            // @ts-ignore
            businessModel: 'PLATFORM_PAYS_FEES',
        },
    });

    // @ts-ignore
    console.log(`✅ Updated business model to: ${updatedUser.businessModel}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
