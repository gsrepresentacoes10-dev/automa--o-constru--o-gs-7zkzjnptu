import { useState, useMemo } from 'react'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Wallet, CheckCircle2, Search, AlertCircle } from 'lucide-react'
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

export default function Payables() {
  const { payables, markPayableAsPaid, suppliers } = useAppContext()
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('all')

  const filteredPayables = useMemo(() => {
    return payables
      .filter((payable) => {
        const isPending = payable.status === 'Pendente'
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const isOverdue = isPending && payable.dueDate && new Date(payable.dueDate) < today

        if (statusFilter === 'pending' && (!isPending || isOverdue)) return false
        if (statusFilter === 'overdue' && !isOverdue) return false
        if (statusFilter === 'paid' && payable.status !== 'Pago') return false

        if (supplierFilter !== 'all' && payable.supplierId !== supplierFilter) return false

        if (dateFrom && new Date(payable.dueDate) < new Date(dateFrom)) return false
        if (
          dateTo &&
          new Date(payable.dueDate) > new Date(new Date(dateTo).setHours(23, 59, 59, 999))
        )
          return false

        return true
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [payables, statusFilter, dateFrom, dateTo, supplierFilter])

  const pendingTotal = filteredPayables
    .filter((s) => s.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const overdueTotal = filteredPayables
    .filter((s) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return s.status === 'Pendente' && s.dueDate && new Date(s.dueDate) < today
    })
    .reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-muted-foreground">
            Gestão de despesas com fornecedores e obrigações geradas pelas compras.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">
              Total a Pagar (Filtro)
            </CardTitle>
            <Wallet className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{formatCurrency(pendingTotal)}</div>
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
        <div className="p-4 border-b flex flex-col lg:flex-row gap-4 bg-muted/20">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="text-xs text-muted-foreground">Fornecedor</Label>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Fornecedores</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 flex-1 min-w-[200px]">
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
            <Label className="text-xs text-muted-foreground">Vencimento Inicial</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Vencimento Final</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter('all')
                setSupplierFilter('all')
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
                <TableHead>Fornecedor</TableHead>
                <TableHead>Descrição / Ref</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayables.map((payable) => {
                const isPending = payable.status === 'Pendente'
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const isOverdue = isPending && payable.dueDate && new Date(payable.dueDate) < today

                return (
                  <TableRow key={payable.id} className={isOverdue ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-medium">{payable.supplierName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div>{payable.description}</div>
                      <div className="text-xs">ID: {payable.id}</div>
                    </TableCell>
                    <TableCell
                      className={
                        isOverdue ? 'text-destructive font-bold flex items-center gap-1.5' : ''
                      }
                    >
                      {isOverdue && <AlertCircle className="h-4 w-4" />}
                      {payable.dueDate
                        ? new Date(payable.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payable.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={isOverdue ? 'destructive' : isPending ? 'secondary' : 'default'}
                        className={!isPending ? 'bg-emerald-500' : ''}
                      >
                        {isOverdue ? 'Atrasado' : payable.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isPending ? (
                        <Button
                          size="sm"
                          variant={isOverdue ? 'default' : 'outline'}
                          onClick={() => markPayableAsPaid(payable.id)}
                          className={
                            isOverdue
                              ? 'bg-destructive hover:bg-destructive/90 text-white'
                              : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                          }
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Pagar
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
              {filteredPayables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    Nenhuma conta a pagar encontrada.
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
