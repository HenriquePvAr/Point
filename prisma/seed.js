// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // 1. Criar a Empresa "Mãe" (Sua empresa de admin)
  const empresaAdmin = await prisma.empresa.create({
    data: {
      nome: "Admin System",
      cnpj: "00000000000000",
      plano: "anual",
      pagoAte: new Date("2099-12-31"), // Nunca vence
      ativo: true
    }
  })

  console.log('🏢 Empresa Admin criada:', empresaAdmin.id)

  // 2. Criar o Usuário Super Admin
  const superAdmin = await prisma.usuario.create({
    data: {
      nome: "Henrique Dev",
      cpf: "00000000000", // Use um CPF válido se tiver validação
      email: "admin@point.com",
      senha: "admin", // IMPORTANTE: Em produção, use hash (bcrypt/argon2)
      role: "SUPER_ADMIN",
      empresaId: empresaAdmin.id,
      primeiroAcesso: false
    }
  })

  console.log('👤 Super Admin criado:', superAdmin.email)
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