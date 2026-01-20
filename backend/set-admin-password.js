const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function run() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@yewon.com'
    const argPass = process.argv[2]
    const password = argPass || process.env.ADMIN_PASSWORD || 'admin123'
    if (!password) {
      console.error('No password provided. Usage: node set-admin-password.js <newPassword>')
      process.exit(1)
    }

    const hashed = await bcrypt.hash(password, 10)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      await prisma.user.update({ where: { email }, data: { password: hashed, role: 'ADMIN' } })
      console.log(`Updated admin password for ${email}`)
    } else {
      await prisma.user.create({ data: { email, name: process.env.ADMIN_NAME || 'Admin', password: hashed, role: 'ADMIN', emailVerified: true } })
      console.log(`Created admin user ${email}`)
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

run()
