'use client'

import { useEffect, useState } from 'react'
import { ChefHat, CheckCircle, Package, RefreshCw, Lock } from 'lucide-react'

type ItemPedido = { id: number; quantidade: number; observacao: string; item: { nome: string } }
type Pedido = {
  id: number
  senha: number
  status: string
  nomeCliente: string | null
  telefone: string | null
  observacaoGeral: string | null
  tipo: string
  total: number
  criadoEm: string
  itens: ItemPedido[]
  pagamento: { metodo: string; status: string } | null
}

const STATUS_COR: Record<string, string> = {
  PAGO:       'border-l-4 border-blue-400',
  EM_PREPARO: 'border-l-4 border-orange-400',
  PRONTO:     'border-l-4 border-green-400',
}

export default function Cozinha() {
  const [autenticado, setAutenticado] = useState(false)
  const [senha, setSenha] = useState('')
  const [erroPwd, setErroPwd] = useState(false)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [atualizando, setAtualizando] = useState(false)

  function autenticar() {
    // Envia senha para testar via API
    fetch('/api/pedidos', { headers: { 'x-admin-password': senha } })
      .then(r => {
        if (r.ok) {
          setAutenticado(true)
          sessionStorage.setItem('cozinhaPwd', senha)
        } else {
          setErroPwd(true)
        }
      })
  }

  useEffect(() => {
    const pwd = sessionStorage.getItem('cozinhaPwd')
    if (pwd) { setSenha(pwd); setAutenticado(true) }
  }, [])

  async function buscarPedidos() {
    setAtualizando(true)
    const res = await fetch('/api/pedidos', { headers: { 'x-admin-password': senha } })
    const data = await res.json()
    setPedidos(data)
    setAtualizando(false)
  }

  useEffect(() => {
    if (!autenticado) return
    buscarPedidos()
    const intervalo = setInterval(buscarPedidos, 5000)
    return () => clearInterval(intervalo)
  }, [autenticado])

  async function avancarStatus(pedido: Pedido) {
    const proximo: Record<string, string> = { PAGO: 'EM_PREPARO', EM_PREPARO: 'PRONTO', PRONTO: 'RETIRADO' }
    const novoStatus = proximo[pedido.status]
    if (!novoStatus) return

    await fetch(`/api/cozinha/${pedido.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': senha },
      body: JSON.stringify({ status: novoStatus }),
    })
    buscarPedidos()
  }

  const btnLabel: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
    PAGO:       { label: 'Iniciar preparo', classes: 'bg-orange-500 hover:bg-orange-600 text-white', icon: <ChefHat size={16} /> },
    EM_PREPARO: { label: 'Marcar como pronto', classes: 'bg-green-500 hover:bg-green-600 text-white', icon: <CheckCircle size={16} /> },
    PRONTO:     { label: 'Confirmar retirada', classes: 'bg-gray-500 hover:bg-gray-600 text-white', icon: <Package size={16} /> },
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-xs text-center shadow-2xl">
          <Lock size={40} className="text-orange-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-1">Acesso à Cozinha</h1>
          <p className="text-gray-500 text-sm mb-4">Digite a senha de acesso</p>
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={e => { setSenha(e.target.value); setErroPwd(false) }}
            onKeyDown={e => e.key === 'Enter' && autenticar()}
            className={`w-full border rounded-xl px-3 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-300 mb-3 ${erroPwd ? 'border-red-400' : 'border-gray-200'}`}
          />
          {erroPwd && <p className="text-red-500 text-sm mb-3">Senha incorreta</p>}
          <button onClick={autenticar} className="btn-primary w-full">Entrar</button>
        </div>
      </div>
    )
  }

  const pagos = pedidos.filter(p => p.status === 'PAGO')
  const emPreparo = pedidos.filter(p => p.status === 'EM_PREPARO')
  const prontos = pedidos.filter(p => p.status === 'PRONTO')

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <ChefHat size={24} className="text-orange-400" />
          <h1 className="text-lg font-bold">Painel da Cozinha</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Atualiza a cada 5s</span>
          <button onClick={buscarPedidos} className={`text-gray-400 hover:text-white transition-colors ${atualizando ? 'animate-spin' : ''}`}>
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Contadores rápidos */}
      <div className="grid grid-cols-3 gap-2 px-3 py-3">
        <div className="bg-blue-900/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-blue-300">{pagos.length}</p>
          <p className="text-xs text-blue-400">Aguardando</p>
        </div>
        <div className="bg-orange-900/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-orange-300">{emPreparo.length}</p>
          <p className="text-xs text-orange-400">Em preparo</p>
        </div>
        <div className="bg-green-900/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-green-300">{prontos.length}</p>
          <p className="text-xs text-green-400">Prontos</p>
        </div>
      </div>

      {/* Fila de pedidos */}
      <div className="px-3 pb-8 space-y-3">
        {pedidos.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            <ChefHat size={48} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum pedido no momento</p>
          </div>
        )}

        {pedidos.map(pedido => {
          const btn = btnLabel[pedido.status]
          const hora = new Date(pedido.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

          return (
            <div key={pedido.id} className={`bg-gray-800 rounded-2xl p-4 ${STATUS_COR[pedido.status] ?? ''}`}>
              {/* Topo: senha + status */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-3xl font-black text-orange-400">{String(pedido.senha).padStart(3, '0')}</span>
                  <span className="ml-2 text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
                    {pedido.tipo === 'ONLINE' ? '🌐 Online' : '🏪 Local'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{hora}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{pedido.nomeCliente || '—'}</p>
                  {pedido.telefone && <p className="text-xs text-gray-400">{pedido.telefone}</p>}
                </div>
              </div>

              {/* Itens */}
              <div className="space-y-1 mb-3">
                {pedido.itens.map(i => (
                  <div key={i.id} className="flex items-start gap-2">
                    <span className="bg-orange-500/20 text-orange-300 text-xs font-bold px-1.5 py-0.5 rounded min-w-[22px] text-center">
                      {i.quantidade}x
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{i.item.nome}</p>
                      {i.observacao && (
                        <p className="text-xs text-yellow-300 italic">⚠ {i.observacao}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Observação geral */}
              {pedido.observacaoGeral && (
                <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl px-3 py-2 mb-3">
                  <p className="text-xs text-yellow-300">📝 {pedido.observacaoGeral}</p>
                </div>
              )}

              {/* Rodapé */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {pedido.pagamento?.metodo} • R$ {pedido.total.toFixed(2).replace('.', ',')}
                </span>
                {btn && (
                  <button
                    onClick={() => avancarStatus(pedido)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${btn.classes}`}
                  >
                    {btn.icon} {btn.label}
                  </button>
                )}
                {pedido.status === 'RETIRADO' && (
                  <span className="text-xs text-gray-500 italic">✓ Retirado</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
