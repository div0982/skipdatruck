// Create Admin User Script
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Check if admin already exists
        const existing = await prisma.user.findUnique({
            where: { email: 'diveshasenthil@gmail.com' },
        });

        if (existing) {
            console.log('Admin user already exists!');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('diveshmaster', 10);

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
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
