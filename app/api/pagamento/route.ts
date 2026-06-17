import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { criarPagamentoPix, criarPagamentoCartao } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { pedidoId, metodo, nomeCliente, telefone, email, cardToken, installments, issuerId, paymentMethodId } = body

  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } })
  if (!pedido) return NextResponse.json({ erro: 'Pedido não encontrado' }, { status: 404 })
  if (pedido.status !== 'AGUARDANDO_PAGAMENTO') {
    return NextResponse.json({ erro: 'Pedido já processado' }, { status: 400 })
  }

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { nomeCliente, telefone },
  })

  // Modo de teste: aprova automaticamente sem chamar o Mercado Pago
  const modoTeste = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http://localhost')

  if (modoTeste) {
    await prisma.pedido.update({ where: { id: pedidoId }, data: { status: 'PAGO' } })
    const pag = await prisma.pagamento.create({
      data: { pedidoId, metodo, status: 'APROVADO', gatewayId: `teste-${Date.now()}` },
    })
    return NextResponse.json({ pagamento: pag, metodo, aprovado: true, teste: true })
  }

  try {
    if (metodo === 'PIX') {
      const resultado = await criarPagamentoPix({
        pedidoId,
        total: pedido.total,
        nomeCliente: nomeCliente || 'Cliente',
        email: email || 'cliente@marmita.com',
      })

      const pag = await prisma.pagamento.create({
        data: {
          pedidoId,
          metodo: 'PIX',
          status: 'PENDENTE',
          gatewayId: resultado.gatewayId,
          qrCode: resultado.qrCode,
          qrCodeB64: resultado.qrCodeB64,
        },
      })
      return NextResponse.json({ pagamento: pag, metodo: 'PIX' })
    }

    if (metodo === 'CARTAO') {
      const resultado = await criarPagamentoCartao({
        pedidoId,
        total: pedido.total,
        nomeCliente: nomeCliente || 'Cliente',
        email: email || 'cliente@marmita.com',
        token: cardToken,
        installments: installments ?? 1,
        issuerId: issuerId ?? '',
        paymentMethodId: paymentMethodId ?? '',
      })

      const statusPedido = resultado.status === 'approved' ? 'PAGO' : 'AGUARDANDO_PAGAMENTO'
      await prisma.pedido.update({ where: { id: pedidoId }, data: { status: statusPedido } })

      const pag = await prisma.pagamento.create({
        data: {
          pedidoId,
          metodo: 'CARTAO',
          status: resultado.status === 'approved' ? 'APROVADO' : 'PENDENTE',
          gatewayId: resultado.gatewayId,
        },
      })
      return NextResponse.json({ pagamento: pag, metodo: 'CARTAO', aprovado: resultado.status === 'approved' })
    }

    return NextResponse.json({ erro: 'Método inválido' }, { status: 400 })
  } catch (err) {
    console.error('Erro pagamento:', err)
    return NextResponse.json({ erro: 'Falha ao processar pagamento' }, { status: 500 })
  }
}
