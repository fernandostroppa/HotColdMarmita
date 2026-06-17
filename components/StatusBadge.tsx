'use client'

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  AGUARDANDO_PAGAMENTO: { label: 'Aguardando pagamento', classes: 'bg-yellow-100 text-yellow-800' },
  PAGO:                 { label: 'Pago — aguardando preparo', classes: 'bg-blue-100 text-blue-800' },
  EM_PREPARO:           { label: 'Em preparo', classes: 'bg-orange-100 text-orange-800' },
  PRONTO:               { label: 'Pronto para retirada!', classes: 'bg-green-100 text-green-800' },
  RETIRADO:             { label: 'Retirado', classes: 'bg-gray-100 text-gray-600' },
  CANCELADO:            { label: 'Cancelado', classes: 'bg-red-100 text-red-800' },
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, classes: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}
