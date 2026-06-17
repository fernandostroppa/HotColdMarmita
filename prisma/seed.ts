import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.contador.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, senha: 0 },
  })

  const itens = [
    {
      nome: 'Marmita P',
      descricao: 'Arroz, feijão, 1 proteína, salada e acompanhamento',
      preco: 18.90,
      categoria: 'Marmita',
      ordem: 1,
    },
    {
      nome: 'Marmita M',
      descricao: 'Arroz, feijão, 1 proteína, salada, acompanhamento e sobremesa',
      preco: 23.90,
      categoria: 'Marmita',
      ordem: 2,
    },
    {
      nome: 'Marmita G',
      descricao: 'Arroz, feijão, 2 proteínas, salada, acompanhamento e sobremesa',
      preco: 29.90,
      categoria: 'Marmita',
      ordem: 3,
    },
    {
      nome: 'Frango Grelhado',
      descricao: 'Peito de frango grelhado temperado',
      preco: 0,
      categoria: 'Proteína do Dia',
      ordem: 4,
    },
    {
      nome: 'Bife Bovino',
      descricao: 'Bife de patinho grelhado',
      preco: 0,
      categoria: 'Proteína do Dia',
      ordem: 5,
    },
    {
      nome: 'Suco Natural 300ml',
      descricao: 'Laranja, limão ou maracujá',
      preco: 7.00,
      categoria: 'Bebida',
      ordem: 6,
    },
    {
      nome: 'Refrigerante Lata',
      descricao: 'Coca-Cola, Guaraná ou Água',
      preco: 5.00,
      categoria: 'Bebida',
      ordem: 7,
    },
  ]

  for (const item of itens) {
    await prisma.itemCardapio.upsert({
      where: { id: item.ordem },
      update: item,
      create: item,
    })
  }

  console.log('Seed concluído!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
