export function formatUnitPrice(unitPrice: string, unit: string): string {
  const value = parseFloat(unitPrice)
  let formatted: string
  if (value < 0.01) {
    formatted = `${(value * 100).toFixed(1)}¢`
  } else if (value < 1.0) {
    formatted = `${(value * 100).toFixed(1)}¢`
  } else {
    formatted = `$${value.toFixed(2)}`
  }
  return `${formatted}/${unit}`
}
