import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function exportSalesToExcel(sales: any[]) {
  const rows = [['Data', 'Produto', 'Categoria', 'Quantidade', 'Preço Unitário', 'Total']]
  sales.forEach((sale) => {
    const date = new Date(sale.date).toLocaleDateString('pt-BR')
    if (sale.items && sale.items.length > 0) {
      sale.items.forEach((item: any) => {
        rows.push([
          date,
          `"${item.product.name}"`,
          `"${item.product.category}"`,
          item.quantity.toString(),
          item.product.price.toString(),
          item.total.toString(),
        ])
      })
    }
  })
  const csvContent = rows.map((e) => e.join(',')).join('\n')
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'vendas.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportPurchasesVsEntriesToExcel(data: any[], period: string) {
  const rows = [
    ['Relatorio de Compras vs Entradas'],
    ['Data de Geracao', new Date().toLocaleDateString('pt-BR')],
    ['Periodo', `Ultimos ${period} dias`],
    [],
    ['Data', 'Volume Comprado (Pedidos)', 'Volume Entregue (Fisico)'],
  ]
  data.forEach((item) => {
    rows.push([item.displayDate, item.volumeComprado.toString(), item.volumeEntregue.toString()])
  })
  const csvContent = rows.map((e) => e.join(',')).join('\n')
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'relatorio_compras_entradas.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
