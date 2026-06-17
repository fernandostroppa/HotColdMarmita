import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { payment } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.type !== 'payment') return NextResponse.json({ ok: true })

    const pagamentoMP = await payment.get({ id: body.data.id })
    const pedidoId = Number(pagamentoMP.external_reference)

    if (!pedidoId) return NextResponse.json({ ok: true })

    const statusMP = pagamentoMP.status

    if (statusMP === 'approved') {
      await prisma.$transaction([
        prisma.pedido.update({
          where: { id: pedidoId },
          data: { status: 'PAGO' },
        }),
        prisma.pagamento.update({
          where: { pedidoId },
          data: { status: 'APROVADO', gatewayId: String(pagamentoMP.id) },
        }),
      ])
    } else if (statusMP === 'rejected' || statusMP === 'cancelled') {
      await prisma.pagamento.update({
        where: { pedidoId },
        data: { status: 'RECUSADO' },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook erro:', err)
    return NextResponse.json({ ok: true })
  }
}
