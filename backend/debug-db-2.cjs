
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DB DEBUG START ---');
    try {
        const files = await prisma.file.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });
        console.log('Found', files.length, 'files');
        files.forEach(f => {
            console.log(`ID: ${f.id} | Title: ${f.title} | Filename: ${f.filename} | Original: ${f.originalName}`);
        });
    } catch (err) {
        console.error('DB Error:', err);
    } finally {
        console.log('--- DB DEBUG END ---');
        process.exit(0);
    }
}

main();
