import { formatCurrency } from '@/lib/utils'
import { Sale } from '@/context/AppContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function PrintableSales({ sales }: { sales: Sale[] }) {
  return (
    <div className="hidden print:block w-full text-black">
      <div className="text-center mb-8 border-b border-black pb-4">
        <h1 className="text-3xl font-bold">CONSTRUMASTER</h1>
        <p className="text-lg">Relatório Analítico de Vendas</p>
        <p className="text-sm">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      <Table className="text-sm">
        <TableHeader>
          <TableRow className="border-black border-b-2">
            <TableHead className="font-bold text-black text-left">Data</TableHead>
            <TableHead className="font-bold text-black text-left">Cliente</TableHead>
            <TableHead className="font-bold text-black text-right">Qtd Itens</TableHead>
            <TableHead className="font-bold text-black text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((s) => (
            <TableRow key={s.id} className="border-black/30">
              <TableCell>{new Date(s.date).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell>{s.customer || 'Consumidor Final'}</TableCell>
              <TableCell className="text-right">
                {s.items.reduce((acc, i) => acc + i.quantity, 0)}
              </TableCell>
              <TableCell className="text-right font-medium text-black">
                {formatCurrency(s.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
