'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { CheckCircle, Clock, ChefHat, Package } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { Contador } from '@/components/Contador'

type Pedido = {
  id: number
  senha: number
  status: string
  nomeCliente: string
  tempoEstimado: number
  total: number
  tipo: string
  itens: Array<{ id: number; quantidade: number; observacao: string; item: { nome: string } }>
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PAGO:       <Clock size={40} className="text-blue-500" />,
  EM_PREPARO: <ChefHat size={40} className="text-red-500" />,
  PRONTO:     <CheckCircle size={40} className="text-green-500" />,
  RETIRADO:   <Package size={40} className="text-gray-400" />,
}

export default function PaginaSenha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [pedido, setPedido] = useState<Pedido | null>(null)

  useEffect(() => {
    const buscar = () =>
      fetch(`/api/pedidos/${id}`)
        .then(r => r.json())
        .then(setPedido)

    buscar()
    const intervalo = setInterval(buscar, 4000)
    return () => clearInterval(intervalo)
  }, [id])

  if (!pedido) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
    </div>
  )

  const pronto = pedido.status === 'PRONTO'
  const retirado = pedido.status === 'RETIRADO'

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-600 to-red-700 flex flex-col items-center justify-center px-4 py-10">
      {/* Senha em destaque */}
      <div className={`rounded-3xl px-12 py-8 text-center mb-6 shadow-2xl transition-all ${pronto ? 'bg-green-500 scale-105' : 'bg-white'}`}>
        <p className={`text-sm font-semibold mb-1 ${pronto ? 'text-green-100' : 'text-gray-500'}`}>
          {pronto ? '🎉 Sua marmita está pronta!' : 'Sua senha é'}
        </p>
        <p className={`text-7xl font-black tracking-tight ${pronto ? 'text-white' : 'text-red-500'}`}>
          {String(pedido.senha).padStart(3, '0')}
        </p>
        {pedido.nomeCliente && (
          <p className={`text-sm mt-2 ${pronto ? 'text-green-100' : 'text-gray-500'}`}>{pedido.nomeCliente}</p>
        )}
      </div>

      {/* Status */}
      <div className="bg-white/20 backdrop-blur rounded-2xl px-5 py-4 text-center mb-4 w-full max-w-sm">
        <div className="flex justify-center mb-2">
          {STATUS_ICONS[pedido.status] ?? <Clock size={40} className="text-white" />}
        </div>
        <StatusBadge status={pedido.status} />
      </div>

      {/* Contador de tempo (só mostra enquanto em preparo/pago e não pronto) */}
      {!pronto && !retirado && (
        <div className="bg-white/20 backdrop-blur rounded-2xl px-5 py-4 text-center mb-4 w-full max-w-sm">
          <p className="text-white/80 text-sm mb-1">Tempo estimado</p>
          <Contador minutos={pedido.tempoEstimado} />
        </div>
      )}

      {/* Instrução ao retirar */}
      {pronto && (
        <div className="bg-white rounded-2xl px-5 py-4 text-center w-full max-w-sm animate-bounce">
          <p className="font-bold text-green-700">Vá ao balcão e apresente a senha</p>
          <p className="text-green-600 text-sm font-mono text-3xl font-black mt-1">{String(pedido.senha).padStart(3, '0')}</p>
        </div>
      )}

      {/* Resumo do pedido */}
      <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mt-4 w-full max-w-sm">
        <h3 className="text-white font-semibold mb-2 text-sm">Itens do pedido</h3>
        {pedido.itens.map(i => (
          <div key={i.id} className="text-white/80 text-sm py-1 flex justify-between">
            <span>{i.quantidade}x {i.item.nome}</span>
            {i.observacao && <span className="text-red-200 text-xs italic">{i.observacao}</span>}
          </div>
        ))}
        <div className="border-t border-white/20 mt-2 pt-2 flex justify-between text-white font-semibold">
          <span>Total pago</span>
          <span>R$ {pedido.total.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      <p className="text-white/60 text-xs mt-6 text-center">
        Esta página atualiza automaticamente a cada 4 segundos
      </p>
    </main>
  )
}
