import { useState } from 'react'
import { useAppContext, Sale } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Search, CalendarDays } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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

  return (
    <div className="space-y-6">
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
          <Button onClick={handleSearch} className="w-full sm:w-auto">
            <Search className="mr-2 h-4 w-4" /> Pesquisar
          </Button>
        </div>
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
                    <TableRow key={sale.id}>
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
  )
}
