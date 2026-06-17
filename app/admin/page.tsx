'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Eye, EyeOff, Lock, Save, X } from 'lucide-react'

type Item = {
  id: number
  nome: string
  descricao: string | null
  preco: number
  categoria: string
  ativo: boolean
  ordem: number
}

const CATEGORIAS = ['Marmita', 'Proteína do Dia', 'Acompanhamento', 'Bebida', 'Sobremesa', 'Outro']

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false)
  const [senha, setSenha] = useState('')
  const [erroPwd, setErroPwd] = useState(false)
  const [itens, setItens] = useState<Item[]>([])
  const [editando, setEditando] = useState<Partial<Item> | null>(null)
  const [salvando, setSalvando] = useState(false)

  function autenticar() {
    fetch('/api/cardapio')
      .then(() => {
        // testa a senha via POST vazio
        return fetch('/api/cardapio', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': senha },
          body: JSON.stringify({ id: 0 }),
        })
      })
      .then(r => {
        if (r.status !== 404 && r.status !== 500) {
          setAutenticado(true)
          sessionStorage.setItem('adminPwd', senha)
        } else {
          setAutenticado(true)
          sessionStorage.setItem('adminPwd', senha)
        }
      })
      .catch(() => {
        setAutenticado(true)
        sessionStorage.setItem('adminPwd', senha)
      })
  }

  // Valida senha via pedidos endpoint
  function testarSenha() {
    fetch('/api/pedidos', { headers: { 'x-admin-password': senha } })
      .then(r => {
        if (r.ok) {
          setAutenticado(true)
          sessionStorage.setItem('adminPwd', senha)
        } else {
          setErroPwd(true)
        }
      })
  }

  useEffect(() => {
    const pwd = sessionStorage.getItem('adminPwd')
    if (pwd) { setSenha(pwd); setAutenticado(true) }
  }, [])

  useEffect(() => {
    if (autenticado) buscarItens()
  }, [autenticado])

  function buscarItens() {
    fetch('/api/cardapio').then(r => r.json()).then(setItens)
  }

  async function salvar() {
    if (!editando) return
    setSalvando(true)
    const isNovo = !editando.id

    await fetch('/api/cardapio', {
      method: isNovo ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': senha },
      body: JSON.stringify(editando),
    })

    buscarItens()
    setEditando(null)
    setSalvando(false)
  }

  async function toggleAtivo(item: Item) {
    await fetch('/api/cardapio', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': senha },
      body: JSON.stringify({ id: item.id, ativo: !item.ativo }),
    })
    buscarItens()
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-xs text-center shadow-xl">
          <Lock size={40} className="text-orange-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-1">Administração</h1>
          <p className="text-gray-500 text-sm mb-4">Digite a senha para continuar</p>
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={e => { setSenha(e.target.value); setErroPwd(false) }}
            onKeyDown={e => e.key === 'Enter' && testarSenha()}
            className={`w-full border rounded-xl px-3 py-3 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-300 mb-3 ${erroPwd ? 'border-red-400' : 'border-gray-200'}`}
          />
          {erroPwd && <p className="text-red-500 text-sm mb-3">Senha incorreta</p>}
          <button onClick={testarSenha} className="btn-primary w-full">Entrar</button>
        </div>
      </div>
    )
  }

  const categorias = [...new Set(itens.map(i => i.categoria))]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white px-4 pt-10 pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Gerenciar Cardápio</h1>
          <p className="text-orange-100 text-sm mt-0.5">{itens.length} itens cadastrados</p>
        </div>
        <button
          onClick={() => setEditando({ nome: '', descricao: '', preco: 0, categoria: 'Marmita', ativo: true, ordem: 99 })}
          className="bg-white text-orange-600 font-semibold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-orange-50 transition-colors"
        >
          <Plus size={16} /> Novo item
        </button>
      </header>

      <div className="px-4 py-4 space-y-6">
        {categorias.map(cat => (
          <section key={cat}>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{cat}</h2>
            <div className="space-y-2">
              {itens.filter(i => i.categoria === cat).map(item => (
                <div key={item.id} className={`card flex items-center gap-3 ${!item.ativo ? 'opacity-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.nome}</p>
                    {item.descricao && <p className="text-xs text-gray-500 truncate">{item.descricao}</p>}
                    <p className="text-orange-600 font-bold text-sm mt-0.5">
                      {item.preco > 0 ? `R$ ${item.preco.toFixed(2).replace('.', ',')}` : 'Incluso'}
                    </p>
                  </div>
                  <button onClick={() => toggleAtivo(item)} className="text-gray-400 hover:text-gray-700 p-1">
                    {item.ativo ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button onClick={() => setEditando(item)} className="text-orange-400 hover:text-orange-600 p-1">
                    <Pencil size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Modal edição */}
      {editando && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setEditando(null)}>
          <div className="bg-white rounded-t-3xl w-full p-5 space-y-3 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">{editando.id ? 'Editar item' : 'Novo item'}</h2>
              <button onClick={() => setEditando(null)} className="text-gray-400"><X size={22} /></button>
            </div>

            <input
              type="text"
              placeholder="Nome do item *"
              value={editando.nome ?? ''}
              onChange={e => setEditando(p => ({ ...p, nome: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <textarea
              placeholder="Descrição (opcional)"
              value={editando.descricao ?? ''}
              onChange={e => setEditando(p => ({ ...p, descricao: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
              rows={2}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={editando.preco ?? 0}
                  onChange={e => setEditando(p => ({ ...p, preco: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ordem</label>
                <input
                  type="number"
                  min="0"
                  value={editando.ordem ?? 99}
                  onChange={e => setEditando(p => ({ ...p, ordem: parseInt(e.target.value) || 99 }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Categoria</label>
              <select
                value={editando.categoria ?? 'Marmita'}
                onChange={e => setEditando(p => ({ ...p, categoria: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editando.ativo ?? true}
                onChange={e => setEditando(p => ({ ...p, ativo: e.target.checked }))}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="text-sm text-gray-700">Visível no cardápio</span>
            </label>

            <button onClick={salvar} disabled={salvando} className="btn-primary w-full flex items-center justify-center gap-2">
              <Save size={16} />
              {salvando ? 'Salvando...' : 'Salvar item'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
