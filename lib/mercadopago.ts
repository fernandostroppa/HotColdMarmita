import MercadoPagoConfig, { Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export const payment = new Payment(client)

export type MetodoPagamento = 'PIX' | 'CARTAO'

export async function criarPagamentoPix(params: {
  pedidoId: number
  total: number
  nomeCliente: string
  email: string
}) {
  const resultado = await payment.create({
    body: {
      transaction_amount: params.total,
      description: `Pedido #${params.pedidoId} - Marmita`,
      payment_method_id: 'pix',
      payer: {
        email: params.email,
        first_name: params.nomeCliente,
      },
      external_reference: String(params.pedidoId),
      ...(process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https') && {
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/pagamento/webhook`,
      }),
    },
  })

  return {
    gatewayId: String(resultado.id),
    qrCode: resultado.point_of_interaction?.transaction_data?.qr_code ?? '',
    qrCodeB64: resultado.point_of_interaction?.transaction_data?.qr_code_base64 ?? '',
  }
}

export async function criarPagamentoCartao(params: {
  pedidoId: number
  total: number
  nomeCliente: string
  email: string
  token: string
  installments: number
  issuerId: string
  paymentMethodId: string
}) {
  const resultado = await payment.create({
    body: {
      transaction_amount: params.total,
      token: params.token,
      description: `Pedido #${params.pedidoId} - Marmita`,
      installments: params.installments,
      payment_method_id: params.paymentMethodId,
      issuer_id: Number(params.issuerId),
      payer: { email: params.email },
      external_reference: String(params.pedidoId),
      ...(process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https') && {
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/pagamento/webhook`,
      }),
    },
  })

  return {
    gatewayId: String(resultado.id),
    status: resultado.status,
  }
}
