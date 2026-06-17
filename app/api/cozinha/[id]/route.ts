import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const senha = req.headers.get('x-admin-password')
  if (senha !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { status } = body

  const statusValidos = ['EM_PREPARO', 'PRONTO', 'RETIRADO']
  if (!statusValidos.includes(status)) {
    return NextResponse.json({ erro: 'Status inválido' }, { status: 400 })
  }

  const pedido = await prisma.pedido.update({
    where: { id: Number(id) },
    data: { status },
    include: { itens: { include: { item: true } }, pagamento: true },
  })

  return NextResponse.json(pedido)
}
