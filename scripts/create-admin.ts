// Create Admin User in Production
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function createAdmin() {
    try {
        console.log('Connecting to database...');
        console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

        // Delete existing admin if exists
        await prisma.user.deleteMany({
            where: { email: 'diveshasenthil@gmail.com' },
        });
        console.log('Deleted any existing admin user');

        // Hash password
        const hashedPassword = await bcrypt.hash('diveshmaster', 10);
        console.log('Password hashed');

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email: 'diveshasenthil@gmail.com',
                password: hashedPassword,
                name: 'Divesh (Admin)',
                role: 'ADMIN',
            },
        });

        console.log('✅ Admin user created successfully!');
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
        console.log('ID:', admin.id);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
