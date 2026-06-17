import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pedido = await prisma.pedido.findUnique({
    where: { id: Number(id) },
    include: { itens: { include: { item: true } }, pagamento: true },
  })
  if (!pedido) return NextResponse.json({ erro: 'Pedido não encontrado' }, { status: 404 })
  return NextResponse.json(pedido)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { nomeCliente, telefone, status } = body

  const pedido = await prisma.pedido.update({
    where: { id: Number(id) },
    data: {
      ...(nomeCliente !== undefined && { nomeCliente }),
      ...(telefone !== undefined && { telefone }),
      ...(status !== undefined && { status }),
    },
    include: { itens: { include: { item: true } }, pagamento: true },
  })
  return NextResponse.json(pedido)
}
