import app from './src/app'
import prisma from './src/config/db'

const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    await prisma.$connect()
    console.log(`📌Environment: ${process.env.NODE_ENV}`)
    console.log('✅ Connected to PostgreSQL DB')

    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Failed to connect to the DB:', error)
    process.exit(1)
  }
}

startServer()
