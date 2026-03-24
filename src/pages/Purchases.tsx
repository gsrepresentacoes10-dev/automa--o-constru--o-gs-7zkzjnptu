import { useState, useMemo } from 'react'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency, cn } from '@/lib/utils'
import {
  Search,
  AlertTriangle,
  TrendingUp,
  CalendarClock,
  ShoppingCart,
  PackageOpen,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Purchases() {
  const { products, sales } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'urgency' | 'name'>('urgency')

  const replenishmentData = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return products.map((product) => {
      const sold30d = sales.reduce((acc, sale) => {
        if (new Date(sale.date) >= thirtyDaysAgo && sale.status !== 'Cancelado') {
          const item = sale.items.find((i) => i.product.id === product.id)
          return acc + (item ? item.quantity : 0)
        }
        return acc
      }, 0)

      const dailyAvg = sold30d / 30
      const daysOfCover = dailyAvg > 0 ? Math.floor(product.stock / dailyAvg) : Infinity
      const targetStock = Math.ceil(Math.max(product.minStock, dailyAvg * 30))
      const suggestedPurchase = Math.max(0, targetStock - product.stock)
      const healthPercentage =
        targetStock > 0 ? Math.min(100, (product.stock / targetStock) * 100) : 100

      let stockZeroDate: Date | null = null
      if (daysOfCover !== Infinity && product.stock > 0) {
        stockZeroDate = new Date(now.getTime() + daysOfCover * 24 * 60 * 60 * 1000)
      }

      let status: 'critical' | 'warning' | 'good' = 'good'
      if (product.stock <= 0 || daysOfCover <= 7) status = 'critical'
      else if (product.stock <= product.minStock || daysOfCover <= 15) status = 'warning'

      return {
        ...product,
        sold30d,
        dailyAvg,
        daysOfCover,
        stockZeroDate,
        suggestedPurchase,
        healthPercentage,
        status,
        targetStock,
      }
    })
  }, [products, sales])

  const filteredAndSortedData = useMemo(() => {
    let result = replenishmentData.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm)),
    )

    return result.sort((a, b) => {
      if (sortBy === 'urgency') {
        if (a.daysOfCover === b.daysOfCover) return a.stock - b.stock
        return a.daysOfCover - b.daysOfCover
      }
      return a.name.localeCompare(b.name)
    })
  }, [replenishmentData, searchTerm, sortBy])

  const summary = useMemo(() => {
    return replenishmentData.reduce(
      (acc, item) => {
        if (item.status === 'critical') acc.critical++
        if (item.suggestedPurchase > 0) {
          acc.itemsToBuy++
          acc.investment += item.suggestedPurchase * item.costPrice
        }
        return acc
      },
      { critical: 0, itemsToBuy: 0, investment: 0 },
    )
  }, [replenishmentData])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planejamento de Reposição</h1>
          <p className="text-muted-foreground">
            Analise o fluxo de estoque, cobertura preditiva e sugestões de compra baseadas em
            vendas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-destructive">Estoque Crítico</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.critical}</div>
            <p className="text-xs text-destructive/80 mt-1">
              Produtos zerados ou &lt; 7 dias de cobertura
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Sugestões de Compra</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.itemsToBuy}</div>
            <p className="text-xs text-muted-foreground mt-1">Itens precisando de reposição</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-primary">
              Investimento Sugerido
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(summary.investment)}
            </div>
            <p className="text-xs text-primary/80 mt-1">
              Para atingir a cobertura ideal de 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto ou SKU..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Ordenar por:
            </span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'urgency' | 'name')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgency">Urgência de Reposição</SelectItem>
                <SelectItem value="name">Nome (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Saúde do Estoque</TableHead>
                <TableHead className="text-center">Vendas (30d) / Média</TableHead>
                <TableHead className="text-center">Cobertura (Dias)</TableHead>
                <TableHead className="text-center">Fim Estimado</TableHead>
                <TableHead className="text-center">Compra Sugerida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">SKU: {item.sku}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 w-full max-w-[130px]">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-medium text-foreground">Atual: {item.stock}</span>
                        <span className="text-muted-foreground">Alvo: {item.targetStock}</span>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all',
                            item.status === 'critical'
                              ? 'bg-destructive'
                              : item.status === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500',
                          )}
                          style={{ width: `${item.healthPercentage}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-medium">{item.sold30d} un</div>
                    <div className="text-[10px] text-muted-foreground">
                      {item.dailyAvg.toFixed(1)} un/dia
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.daysOfCover === Infinity ? (
                      <Badge variant="outline" className="text-muted-foreground font-normal">
                        Sem vendas
                      </Badge>
                    ) : (
                      <Badge
                        variant={item.status === 'critical' ? 'destructive' : 'outline'}
                        className={cn(
                          item.status === 'warning' &&
                            'bg-amber-100 text-amber-800 border-amber-200',
                          item.status === 'good' &&
                            'bg-emerald-50 text-emerald-700 border-emerald-200 font-normal',
                        )}
                      >
                        {item.daysOfCover} dias
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.stockZeroDate ? (
                      <div className="flex items-center justify-center gap-1.5 text-sm">
                        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span
                          className={
                            item.status === 'critical' ? 'text-destructive font-medium' : ''
                          }
                        >
                          {item.stockZeroDate.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.suggestedPurchase > 0 ? (
                      <div className="flex items-center justify-center">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-sm py-1',
                            item.status === 'critical'
                              ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20'
                              : 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20',
                          )}
                        >
                          <PackageOpen className="h-3.5 w-3.5 mr-1.5" />+ {item.suggestedPurchase}{' '}
                          un
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm flex items-center justify-center">
                        Estoque OK
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredAndSortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
