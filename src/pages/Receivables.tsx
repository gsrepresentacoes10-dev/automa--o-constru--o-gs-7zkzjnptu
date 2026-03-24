import { useState, useMemo } from 'react'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Landmark, CheckCircle2, Search, AlertCircle } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

export default function Receivables() {
  const { sales, markSaleAsPaid } = useAppContext()
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const creditSales = useMemo(
    () => sales.filter((s) => s.paymentMethod === 'Venda a Prazo'),
    [sales],
  )

  const filteredReceivables = useMemo(() => {
    return creditSales
      .filter((sale) => {
        const isPending = sale.status === 'Pendente'
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const isOverdue = isPending && sale.dueDate && new Date(sale.dueDate) < today

        if (statusFilter === 'pending' && (!isPending || isOverdue)) return false
        if (statusFilter === 'overdue' && !isOverdue) return false
        if (statusFilter === 'paid' && sale.status !== 'Pago') return false

        if (dateFrom && new Date(sale.date) < new Date(dateFrom)) return false
        if (dateTo && new Date(sale.date) > new Date(new Date(dateTo).setHours(23, 59, 59, 999)))
          return false

        return true
      })
      .sort(
        (a, b) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime(),
      )
  }, [creditSales, statusFilter, dateFrom, dateTo])

  const pendingTotal = filteredReceivables
    .filter((s) => s.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.total, 0)

  const overdueTotal = filteredReceivables
    .filter((s) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return s.status === 'Pendente' && s.dueDate && new Date(s.dueDate) < today
    })
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
          <h1 className="text-2xl font-bold tracking-tight">
            Relatório de Inadimplência / Contas a Receber
          </h1>
          <p className="text-muted-foreground">
            Gerencie pagamentos pendentes, atrasos e recebimentos.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Total a Receber (Filtro)
            </CardTitle>
            <Landmark className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(pendingTotal)}</div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Total em Atraso (Filtro)
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(overdueTotal)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b flex flex-col md:flex-row gap-4 bg-muted/20">
          <div className="space-y-1.5 flex-1 max-w-xs">
            <Label className="text-xs text-muted-foreground">Status do Pagamento</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Apenas Pendentes (No Prazo)</SelectItem>
                <SelectItem value="overdue">Atrasados (Vencidos)</SelectItem>
                <SelectItem value="paid">Pagos (Liquidados)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Data Inicial (Venda)</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Data Final (Venda)</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter('all')
                setDateFrom('')
                setDateTo('')
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Nº Venda</TableHead>
                <TableHead>Data da Venda</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceivables.map((sale) => {
                const isPending = sale.status === 'Pendente'
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const isOverdue = isPending && sale.dueDate && new Date(sale.dueDate) < today

                return (
                  <TableRow key={sale.id} className={isOverdue ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-medium">{sale.customer}</TableCell>
                    <TableCell className="text-muted-foreground">{sale.id}</TableCell>
                    <TableCell>{new Date(sale.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell
                      className={
                        isOverdue ? 'text-destructive font-bold flex items-center gap-1.5' : ''
                      }
                    >
                      {isOverdue && <AlertCircle className="h-4 w-4" />}
                      {sale.dueDate
                        ? new Date(sale.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={isOverdue ? 'destructive' : isPending ? 'secondary' : 'default'}
                        className={!isPending ? 'bg-emerald-500' : ''}
                      >
                        {isOverdue ? 'Atrasado' : sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isPending ? (
                        <Button
                          size="sm"
                          variant={isOverdue ? 'default' : 'outline'}
                          onClick={() => handleMarkAsPaid(sale.id, sale.customer)}
                          className={
                            isOverdue
                              ? 'bg-destructive hover:bg-destructive/90 text-white'
                              : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                          }
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Baixar
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Liquidado
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredReceivables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    Nenhum registro encontrado com os filtros atuais.
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
