import { formatUnitPrice } from "@/lib/format-unit-price"

interface UnitPriceDisplayProps {
  totalPrice: string
  quantity: string
  unit: string
}

export default function UnitPriceDisplay({ totalPrice, quantity, unit }: UnitPriceDisplayProps) {
  const total = parseFloat(totalPrice)
  const qty = parseFloat(quantity)
  const hasValue = !isNaN(total) && !isNaN(qty) && total > 0 && qty > 0 && unit.trim()

  const formatted = hasValue
    ? formatUnitPrice((total / qty).toFixed(10), unit)
    : null

  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
        Unit price
      </p>
      {formatted ? (
        <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">{formatted}</p>
      ) : (
        <p className="text-sm text-slate-400 mt-0.5">Enter price &amp; quantity</p>
      )}
    </div>
  )
}
