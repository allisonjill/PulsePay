import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient()

async function main() {
    await prisma.payment.deleteMany()

    const statuses = ["Created", "Authorized", "Captured", "Failed", "Refunded"]
    const currencies = ["USD", "EUR", "GBP"]
    const merchantIds = ["merch_01", "merch_02", "merch_03", "merch_04", "merch_05"]

    console.log('Seeding...')

    for (let i = 0; i < 25; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const currency = currencies[Math.floor(Math.random() * currencies.length)]
        const merchantId = merchantIds[Math.floor(Math.random() * merchantIds.length)]
        const amountCents = Math.floor(Math.random() * 10000) + 100 // 1.00 to 100.00
        // Random date within last 30 days
        const randomTime = new Date().getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)

        await prisma.payment.create({
            data: {
                amountCents,
                currency,
                merchantId,
                status,
                createdAt: new Date(randomTime)
            }
        })
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
