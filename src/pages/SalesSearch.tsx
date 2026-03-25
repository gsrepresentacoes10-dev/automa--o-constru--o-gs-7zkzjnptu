import { useState, useMemo } from 'react'
import { useAppContext, Sale } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Search, CalendarDays, Printer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function SalesSearch() {
  const { sales } = useAppContext()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = () => {
    let filtered = sales

    if (dateFrom) {
      const from = new Date(dateFrom + 'T00:00:00')
      filtered = filtered.filter((s) => new Date(s.date) >= from)
    }

    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59')
      filtered = filtered.filter((s) => new Date(s.date) <= to)
    }

    setFilteredSales(
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    )
    setHasSearched(true)
  }

  const totalSalesAmount = useMemo(() => {
    return filteredSales.reduce(
      (acc, sale) => acc + (sale.status !== 'Cancelado' ? sale.total : 0),
      0,
    )
  }, [filteredSales])

  const handlePrint = () => {
    window.print()
  }

  const periodLabel = useMemo(() => {
    if (!dateFrom && !dateTo) return 'Todo o período'
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início'
    const to = dateTo ? new Date(dateTo + 'T23:59:59').toLocaleDateString('pt-BR') : 'Hoje'
    return `${from} a ${to}`
  }, [dateFrom, dateTo])

  return (
    <>
      <div className="space-y-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesquisa de Vendas por Período</h1>
          <p className="text-muted-foreground">
            Filtre o histórico de vendas definindo um período específico para análise.
          </p>
        </div>

        <Card>
          <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1.5 w-full sm:w-auto flex-1 max-w-[200px]">
              <Label>Data Início</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5 w-full sm:w-auto flex-1 max-w-[200px]">
              <Label>Data Fim</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={handleSearch} className="flex-1 sm:flex-none">
                <Search className="mr-2 h-4 w-4" /> Pesquisar
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={!hasSearched || filteredSales.length === 0}
                className="flex-1 sm:flex-none"
              >
                <Printer className="mr-2 h-4 w-4" /> Imprimir Relatório
              </Button>
            </div>
          </div>
        </Card>

        {hasSearched && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-1 border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Resumo do Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totalSalesAmount)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total em Vendas ({filteredSales.filter((s) => s.status !== 'Cancelado').length}{' '}
                  transações válidas)
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Data / Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-center pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hasSearched ? (
                  filteredSales.length > 0 ? (
                    filteredSales.map((sale) => (
                      <TableRow
                        key={sale.id}
                        className={sale.status === 'Cancelado' ? 'opacity-60 bg-muted/50' : ''}
                      >
                        <TableCell className="pl-6">
                          <div className="font-medium">
                            {new Date(sale.date).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-muted-foreground">{sale.id}</div>
                        </TableCell>
                        <TableCell>{sale.customer || 'Consumidor Final'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {sale.sellerName || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(sale.total)}
                        </TableCell>
                        <TableCell className="text-center pr-6">
                          <Badge
                            variant={
                              sale.status === 'Pago'
                                ? 'default'
                                : sale.status === 'Cancelado'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className={sale.status === 'Pago' ? 'bg-emerald-500' : ''}
                          >
                            {sale.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        <CalendarDays className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        Nenhuma venda encontrada para o período selecionado.
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-3 opacity-20" />
                      Defina o período e clique em "Pesquisar" para visualizar as vendas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Print View */}
      <div className="hidden print:block text-black bg-white w-full">
        <div className="mb-6 border-b-2 border-black pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">Extrato de Vendas</h1>
            <p className="text-sm mt-1 text-gray-600">Período: {periodLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Resumo do Período
            </p>
            <p className="text-xl font-bold">{formatCurrency(totalSalesAmount)}</p>
          </div>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2 font-bold w-1/4">Data / Hora</th>
              <th className="text-left py-2 font-bold w-1/2">Descrição / Cliente</th>
              <th className="text-right py-2 font-bold w-1/4">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale) => (
              <tr
                key={sale.id}
                className={`border-b border-gray-200 ${sale.status === 'Cancelado' ? 'text-gray-400 line-through' : ''}`}
              >
                <td className="py-2">
                  {new Date(sale.date).toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="py-2">
                  <span className="font-medium">{sale.customer || 'Consumidor Final'}</span>
                  {sale.status === 'Cancelado' && (
                    <span className="ml-2 text-xs italic">(Cancelada)</span>
                  )}
                </td>
                <td className="py-2 text-right tabular-nums">{formatCurrency(sale.total)}</td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500 italic">
                  Nenhuma venda registrada no período selecionado.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black">
              <td colSpan={2} className="py-3 font-bold text-right text-sm uppercase">
                Total em Vendas Válidas:
              </td>
              <td className="py-3 font-bold text-right text-base tabular-nums">
                {formatCurrency(totalSalesAmount)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-center text-gray-500">
          Documento gerado em {new Date().toLocaleString('pt-BR')} - Sistema ConstruMaster
        </div>
      </div>
    </>
  )
}
