import { useMemo } from 'react'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Landmark, CheckCircle2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function Receivables() {
  const { sales, markSaleAsPaid } = useAppContext()

  const creditSales = useMemo(
    () => sales.filter((s) => s.paymentMethod === 'Venda a Prazo'),
    [sales],
  )

  const pendingTotal = creditSales
    .filter((s) => s.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.total, 0)

  const handleMarkAsPaid = (id: string, customer: string | undefined) => {
    markSaleAsPaid(id)
    toast({
      title: 'Pagamento Registrado',
      description: `A venda de ${customer || 'Cliente'} foi marcada como paga.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas a Receber</h1>
          <p className="text-muted-foreground">Gerencie pagamentos pendentes de Vendas a Prazo.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total a Receber</CardTitle>
            <Landmark className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(pendingTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Nº Venda</TableHead>
                <TableHead>Data da Venda</TableHead>
                <TableHead>Data de Vencimento</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditSales.map((sale) => {
                const isPending = sale.status === 'Pendente'
                const isOverdue = isPending && sale.dueDate && new Date(sale.dueDate) < new Date()

                return (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.customer}</TableCell>
                    <TableCell className="text-muted-foreground">{sale.id}</TableCell>
                    <TableCell>{new Date(sale.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className={isOverdue ? 'text-destructive font-bold' : ''}>
                      {sale.dueDate ? new Date(sale.dueDate).toLocaleDateString('pt-BR') : '-'}
                      {isOverdue && <span className="ml-2 text-xs">(Atrasado)</span>}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={isPending ? 'secondary' : 'default'}
                        className={!isPending ? 'bg-emerald-500' : ''}
                      >
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isPending ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsPaid(sale.id, sale.customer)}
                          className="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar Pago
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Liquidado</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {creditSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma venda a prazo encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
