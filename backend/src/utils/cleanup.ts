import dayjs from 'dayjs'
import prisma from '../config/db'

export const cleanupUnverifiedAuth = async () => {
  const cutoff = dayjs().subtract(24, 'hour').toDate()

  const deletedAuths = await prisma.$transaction(async (tx) => {
    // Step 1: Get IDs of unverified users older than 24h
    const authsToDelete = await tx.auth.findMany({
      where: {
        isVerified: false,
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    })

    const authIds = authsToDelete.map((a) => a.id)

    if (authIds.length === 0) {
      return { count: 0 }
    }

    // Step 2: Delete associated email verification tokens
    await tx.emailVerificationToken.deleteMany({
      where: {
        authId: { in: authIds },
      },
    })

    // Step 3: Delete the auth records
    const deleted = await tx.auth.deleteMany({
      where: { id: { in: authIds } },
    })

    return { count: deleted.count }
  })

  console.log(
    `[CLEANUP] Deleted ${deletedAuths.count} unverified auth records and their tokens`
  )
}
