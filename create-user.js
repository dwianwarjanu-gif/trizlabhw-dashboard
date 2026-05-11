const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10)

  const user = await prisma.user.create({
    data: {
      email: 'admin2@mail.com',
      password: passwordHash, // HARUS string hash
      fullName: 'Admin',
      role: 'ADMIN',
      isActive: true
    }
  })

  console.log('User created:', user)
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })