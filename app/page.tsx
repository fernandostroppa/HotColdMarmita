'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Plus, Minus, X, ChevronRight, MapPin, Wifi } from 'lucide-react'

type Item = {
  id: number
  nome: string
  descricao: string | null
  preco: number
  categoria: string
}

type ItemCarrinho = Item & { quantidade: number; observacao: string }

export default function Cardapio() {
  const router = useRouter()
  const [itens, setItens] = useState<Item[]>([])
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [observacaoGeral, setObservacaoGeral] = useState('')
  const [tipo, setTipo] = useState<'LOCAL' | 'ONLINE'>('LOCAL')
  const [carregando, setCarregando] = useState(true)
  const [finalizando, setFinalizando] = useState(false)

  useEffect(() => {
    fetch('/api/cardapio')
      .then(r => r.json())
      .then(setItens)
      .finally(() => setCarregando(false))
  }, [])

  const categorias = [...new Set(itens.map(i => i.categoria))]

  function addItem(item: Item) {
    setCarrinho(prev => {
      const existe = prev.find(c => c.id === item.id)
      if (existe) return prev.map(c => c.id === item.id ? { ...c, quantidade: c.quantidade + 1 } : c)
      return [...prev, { ...item, quantidade: 1, observacao: '' }]
    })
  }

  function removeItem(id: number) {
    setCarrinho(prev => {
      const item = prev.find(c => c.id === id)
      if (!item) return prev
      if (item.quantidade === 1) return prev.filter(c => c.id !== id)
      return prev.map(c => c.id === id ? { ...c, quantidade: c.quantidade - 1 } : c)
    })
  }

  function getQtd(id: number) {
    return carrinho.find(c => c.id === id)?.quantidade ?? 0
  }

  const total = carrinho.reduce((s, c) => s + c.preco * c.quantidade, 0)
  const qtdTotal = carrinho.reduce((s, c) => s + c.quantidade, 0)

  async function finalizar() {
    if (carrinho.length === 0) return
    setFinalizando(true)
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: carrinho.map(c => ({ itemId: c.id, quantidade: c.quantidade, observacao: c.observacao })),
          observacaoGeral,
          tipo,
        }),
      })
      const pedido = await res.json()
      router.push(`/pagamento/${pedido.id}`)
    } catch {
      alert('Erro ao criar pedido. Tente novamente.')
      setFinalizando(false)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-3" />
          <p className="text-gray-500">Carregando cardápio...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen pb-32">
      {/* Header */}
      <header className="bg-red-600 text-white px-4 pt-10 pb-6">
        <h1 className="text-2xl font-bold">🍱 Hot & Cold Self Service</h1>
        <p className="text-red-100 text-sm mt-1">Cardápio do dia — escolha sua marmita e finalize o pedido</p>

        {/* Tipo de pedido */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setTipo('LOCAL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${tipo === 'LOCAL' ? 'bg-white text-red-600' : 'bg-red-700 text-white border border-red-300'}`}
          >
            <MapPin size={14} /> Vou retirar presencialmente
          </button>
          <button
            onClick={() => setTipo('ONLINE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${tipo === 'ONLINE' ? 'bg-white text-red-600' : 'bg-red-700 text-white border border-red-300'}`}
          >
            <Wifi size={14} /> Pedido online
          </button>
        </div>
      </header>

      {/* Itens por categoria */}
      <div className="px-4 py-4 space-y-6">
        {categorias.map(cat => (
          <section key={cat}>
            <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-red-600 rounded-full inline-block" />
              {cat}
            </h2>
            <div className="space-y-3">
              {itens.filter(i => i.categoria === cat).map(item => (
                <div key={item.id} className="card flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{item.nome}</p>
                    {item.descricao && <p className="text-sm text-gray-500 mt-0.5 leading-snug">{item.descricao}</p>}
                    {item.preco > 0 && (
                      <p className="text-red-600 font-bold mt-1">
                        R$ {item.preco.toFixed(2).replace('.', ',')}
                      </p>
                    )}
                  </div>

                  {getQtd(item.id) === 0 ? (
                    <button onClick={() => addItem(item)} className="btn-primary py-2 px-4 text-sm">
                      Adicionar
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeItem(item.id)} className="w-8 h-8 rounded-full bg-orange-100 text-red-600 flex items-center justify-center hover:bg-orange-200 transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-bold">{getQtd(item.id)}</span>
                      <button onClick={() => addItem(item)} className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Observação geral */}
        <div className="card">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Alguma observação geral?
          </label>
          <textarea
            value={observacaoGeral}
            onChange={e => setObservacaoGeral(e.target.value)}
            placeholder="Ex: sem cebola, bife mal passado, etc."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
            rows={3}
          />
        </div>
      </div>

      {/* Botão carrinho fixo */}
      {qtdTotal > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <button
            onClick={() => setCarrinhoAberto(true)}
            className="btn-primary w-full flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="bg-white text-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">{qtdTotal}</span>
              Ver carrinho
            </span>
            <span className="flex items-center gap-1">
              R$ {total.toFixed(2).replace('.', ',')}
              <ChevronRight size={18} />
            </span>
          </button>
        </div>
      )}

      {/* Carrinho (drawer) */}
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50" onClick={() => setCarrinhoAberto(false)}>
          <div className="bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart size={20} className="text-red-500" /> Seu pedido
              </h2>
              <button onClick={() => setCarrinhoAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {carrinho.map(item => (
                <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-gray-100">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">{item.nome}</p>
                      {item.preco > 0 && (
                        <p className="font-semibold text-red-600 ml-2">
                          R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                        </p>
                      )}
                    </div>
                    <textarea
                      value={item.observacao}
                      onChange={e => setCarrinho(prev =>
                        prev.map(c => c.id === item.id ? { ...c, observacao: e.target.value } : c)
                      )}
                      placeholder="Observação (ex: mal passado, sem sal...)"
                      className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-orange-300"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-full bg-orange-100 text-red-600 flex items-center justify-center">
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantidade}</span>
                    <button onClick={() => addItem(item)} className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-lg font-bold mb-5 pt-2">
              <span>Total</span>
              <span className="text-red-600">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>

            <button
              onClick={finalizar}
              disabled={finalizando}
              className="btn-primary w-full text-center"
            >
              {finalizando ? 'Processando...' : 'Ir para pagamento →'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
