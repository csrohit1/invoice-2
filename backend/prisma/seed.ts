import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function main() {
  const defaultPlans = [
    {
      name: 'Basic',
      price: 49900, // ₹499.00 in paise
      durationDays: 30,
      description: 'For small businesses with basic needs',
      features: {
        userLimit: 2,
        invoiceLimit: 100,
        support: 'Email',
      },
    },
    {
      name: 'Pro',
      price: 99900,
      durationDays: 30,
      description: 'For growing teams with more usage',
      features: {
        userLimit: 5,
        invoiceLimit: 500,
        support: 'Priority Email',
        analytics: true,
      },
    },
    {
      name: 'Enterprise',
      price: 199900,
      durationDays: 30,
      description: 'Full access and premium support',
      features: {
        userLimit: 50,
        invoiceLimit: null, // Unlimited
        support: '24/7 Phone & Email',
        analytics: true,
        customBranding: true,
      },
    },
  ]

  for (const plan of defaultPlans) {
    await prisma.plan.upsert({
      where: { id: plan.id || '' }, // Ensure 'id' is provided or handle accordingly
      update: plan,
      create: plan,
    })
  }

  console.log('✅ Plans seeded successfully')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
