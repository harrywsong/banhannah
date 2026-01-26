import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const files = await prisma.file.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(files, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
