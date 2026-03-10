import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const adminCreds = await prisma.globalSettings.findUnique({
        where: { key: "admin_credentials" }
    });
    
    if (adminCreds) {
        console.log('Admin credentials found:');
        const creds = JSON.parse(adminCreds.value);
        console.log('Username:', creds.username);
        console.log('Password hash exists:', !!creds.passwordHash);
    } else {
        console.log('No admin credentials found in database.');
    }
    
    await prisma.$disconnect();
}

main().catch(console.error);
