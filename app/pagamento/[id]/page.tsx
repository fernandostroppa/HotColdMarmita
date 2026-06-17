'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, QrCode, ChevronLeft, Copy, Check } from 'lucide-react'
import Image from 'next/image'

type Pedido = {
  id: number
  senha: number
  total: number
  status: string
  itens: Array<{ id: number; quantidade: number; observacao: string; item: { nome: string; preco: number } }>
}

export default function PaginaPagamento({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = React.use(params)
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [metodo, setMetodo] = useState<'PIX' | 'CARTAO'>('PIX')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [processando, setProcessando] = useState(false)
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeB64: string } | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch(`/api/pedidos/${id}`)
      .then(r => r.json())
      .then(setPedido)
  }, [id])

  // Polling: quando o PIX é pago, redireciona
  useEffect(() => {
    if (!pixData) return
    const intervalo = setInterval(async () => {
      const res = await fetch(`/api/pedidos/${id}`)
      const p = await res.json()
      if (p.status === 'PAGO') {
        clearInterval(intervalo)
        router.push(`/senha/${id}`)
      }
    }, 3000)
    return () => clearInterval(intervalo)
  }, [pixData, id, router])

  async function pagar() {
    if (!nome.trim()) { setErro('Informe seu nome'); return }
    if (!telefone.trim()) { setErro('Informe seu telefone'); return }
    setErro('')
    setProcessando(true)

    try {
      const res = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId: pedido!.id,
          metodo,
          nomeCliente: nome,
          telefone,
          email: email || `${telefone}@marmita.com`,
        }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.erro)

      if (data.teste || data.aprovado) {
        router.push(`/senha/${id}`)
      } else if (metodo === 'PIX') {
        setPixData({ qrCode: data.pagamento.qrCode, qrCodeB64: data.pagamento.qrCodeB64 })
      } else {
        setErro('Pagamento não aprovado. Verifique os dados do cartão.')
      }
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao processar')
    } finally {
      setProcessando(false)
    }
  }

  function copiarPix() {
    if (!pixData?.qrCode) return
    navigator.clipboard.writeText(pixData.qrCode)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  if (!pedido) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
    </div>
  )

  return (
    <main className="min-h-screen pb-10">
      <header className="bg-red-600 text-white px-4 pt-10 pb-5">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-red-100 text-sm mb-3">
          <ChevronLeft size={16} /> Voltar
        </button>
        <h1 className="text-xl font-bold">Pagamento</h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Resumo */}
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-2">Resumo do pedido</h2>
          {pedido.itens.map(i => (
            <div key={i.id} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
              <span className="text-gray-600">{i.quantidade}x {i.item.nome}</span>
              {i.item.preco > 0 && <span>R$ {(i.item.preco * i.quantidade).toFixed(2).replace('.', ',')}</span>}
            </div>
          ))}
          <div className="flex justify-between font-bold text-lg mt-3">
            <span>Total</span>
            <span className="text-red-600">R$ {pedido.total.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        {/* Dados do cliente */}
        <div className="card space-y-3">
          <h2 className="font-bold text-gray-700">Seus dados</h2>
          <input
            type="text"
            placeholder="Seu nome *"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <input
            type="tel"
            placeholder="Telefone / WhatsApp *"
            value={telefone}
            onChange={e => setTelefone(e.target.value.replace(/\D/g, ''))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <input
            type="email"
            placeholder="E-mail (opcional)"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Método de pagamento */}
        {!pixData && (
          <div className="card">
            <h2 className="font-bold text-gray-700 mb-3">Forma de pagamento</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMetodo('PIX')}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-colors ${metodo === 'PIX' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}
              >
                <QrCode size={28} className={metodo === 'PIX' ? 'text-red-500' : 'text-gray-400'} />
                <span className="font-semibold text-sm">PIX</span>
                <span className="text-xs text-green-600 font-medium">Aprovação imediata</span>
              </button>
              <button
                onClick={() => setMetodo('CARTAO')}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-colors ${metodo === 'CARTAO' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}
              >
                <CreditCard size={28} className={metodo === 'CARTAO' ? 'text-red-500' : 'text-gray-400'} />
                <span className="font-semibold text-sm">Cartão</span>
                <span className="text-xs text-gray-500">Crédito / Débito</span>
              </button>
            </div>

            {metodo === 'CARTAO' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                💳 O formulário do cartão será aberto via Mercado Pago (checkout seguro).
              </div>
            )}
          </div>
        )}

        {/* QR Code PIX */}
        {pixData && (
          <div className="card text-center space-y-4">
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-green-700 font-semibold">📱 Escaneie o QR Code para pagar</p>
              <p className="text-green-600 text-sm mt-1">Aguardando confirmação do pagamento...</p>
            </div>

            {pixData.qrCodeB64 && (
              <div className="flex justify-center">
                <Image
                  src={`data:image/png;base64,${pixData.qrCodeB64}`}
                  alt="QR Code PIX"
                  width={200}
                  height={200}
                  className="rounded-xl border-4 border-orange-100"
                />
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-3 text-left">
              <p className="text-xs text-gray-500 mb-1">Ou copie o código PIX:</p>
              <p className="text-xs font-mono text-gray-700 break-all">{pixData.qrCode.substring(0, 60)}...</p>
            </div>

            <button onClick={copiarPix} className="btn-secondary w-full flex items-center justify-center gap-2">
              {copiado ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar código PIX</>}
            </button>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-400 border-t-transparent" />
              Aguardando pagamento...
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            ⚠️ {erro}
          </div>
        )}

        {/* Botão pagar */}
        {!pixData && (
          <button onClick={pagar} disabled={processando} className="btn-primary w-full">
            {processando ? 'Processando...' : `Pagar R$ ${pedido.total.toFixed(2).replace('.', ',')} →`}
          </button>
        )}
      </div>
    </main>
  )
}
