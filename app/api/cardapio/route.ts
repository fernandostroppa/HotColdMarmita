import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const itens = await prisma.itemCardapio.findMany({
    where: { ativo: true },
    orderBy: [{ categoria: 'asc' }, { ordem: 'asc' }],
  })
  return NextResponse.json(itens)
}

export async function POST(req: NextRequest) {
  const senha = req.headers.get('x-admin-password')
  if (senha !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const item = await prisma.itemCardapio.create({ data: body })
  return NextResponse.json(item, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const senha = req.headers.get('x-admin-password')
  if (senha !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { id, ...dados } = body
  const item = await prisma.itemCardapio.update({ where: { id }, data: dados })
  return NextResponse.json(item)
}
