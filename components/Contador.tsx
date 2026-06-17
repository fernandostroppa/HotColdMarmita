'use client'

import { useEffect, useState } from 'react'

export function Contador({ minutos }: { minutos: number }) {
  const [segundos, setSegundos] = useState(minutos * 60)

  useEffect(() => {
    if (segundos <= 0) return
    const t = setTimeout(() => setSegundos(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [segundos])

  const m = Math.floor(segundos / 60)
  const s = segundos % 60

  if (segundos <= 0) return <span className="text-green-600 font-bold">Pedido pronto em breve!</span>

  return (
    <span className="font-mono text-2xl font-bold text-laranja-600">
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  )
}
