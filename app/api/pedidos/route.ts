import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { itens, observacaoGeral, tipo } = body

  if (!itens || itens.length === 0) {
    return NextResponse.json({ erro: 'Carrinho vazio' }, { status: 400 })
  }

  const ids = itens.map((i: { itemId: number }) => i.itemId)
  const itemsDb = await prisma.itemCardapio.findMany({ where: { id: { in: ids } } })

  let total = 0
  const itensMontados = itens.map((i: { itemId: number; quantidade: number; observacao?: string }) => {
    const item = itemsDb.find(db => db.id === i.itemId)
    if (!item) throw new Error(`Item ${i.itemId} não encontrado`)
    total += item.preco * i.quantidade
    return {
      itemId: i.itemId,
      quantidade: i.quantidade,
      observacao: i.observacao ?? '',
      precoUnitario: item.preco,
    }
  })

  const contador = await prisma.contador.upsert({
    where: { id: 1 },
    update: { senha: { increment: 1 } },
    create: { id: 1, senha: 1 },
  })

  const pedido = await prisma.pedido.create({
    data: {
      senha: contador.senha,
      total,
      observacaoGeral: observacaoGeral ?? '',
      tipo: tipo ?? 'LOCAL',
      status: 'AGUARDANDO_PAGAMENTO',
      itens: { create: itensMontados },
    },
    include: { itens: { include: { item: true } } },
  })

  return NextResponse.json(pedido, { status: 201 })
}

export async function GET(req: NextRequest) {
  const senha = req.headers.get('x-admin-password')
  if (senha !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const pedidos = await prisma.pedido.findMany({
    where: { status: { in: ['PAGO', 'EM_PREPARO', 'PRONTO'] } },
    include: { itens: { include: { item: true } }, pagamento: true },
    orderBy: { criadoEm: 'asc' },
  })
  return NextResponse.json(pedidos)
}
