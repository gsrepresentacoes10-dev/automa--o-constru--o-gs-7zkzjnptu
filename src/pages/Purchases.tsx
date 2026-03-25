import { useState, useMemo, useEffect } from 'react'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency, cn } from '@/lib/utils'
import {
  Search,
  AlertTriangle,
  TrendingUp,
  CalendarClock,
  ShoppingCart,
  Calculator,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'

export default function Purchases() {
  const { products, sales, purchases, suppliers, updateProduct, addPurchase, addPayable } =
    useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'urgency' | 'name'>('urgency')
  const [purchaseFilter, setPurchaseFilter] = useState<string>('all')

  const [leadTimeInputs, setLeadTimeInputs] = useState<Record<string, string>>({})
  const [historyFrom, setHistoryFrom] = useState('')
  const [historyTo, setHistoryTo] = useState('')
  const [historySupplier, setHistorySupplier] = useState('all')

  const [isCalcOpen, setIsCalcOpen] = useState(false)
  const [calcProduct, setCalcProduct] = useState<any>(null)
  const [calcMargin, setCalcMargin] = useState<number>(40)

  // New Purchase State
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState('none')
  const [purchaseItems, setPurchaseItems] = useState<
    { product: any; quantity: number; costPrice: number }[]
  >([])
  const [installments, setInstallments] = useState<{ dueDate: string; amount: number }[]>([])

  const newPurchaseTotal = useMemo(
    () => purchaseItems.reduce((acc, item) => acc + item.quantity * item.costPrice, 0),
    [purchaseItems],
  )

  // Auto-sync first installment if there's only one
  useEffect(() => {
    if (installments.length <= 1) {
      setInstallments([{ dueDate: installments[0]?.dueDate || '', amount: newPurchaseTotal }])
    }
  }, [newPurchaseTotal])

  const handleLeadTimeChange = (id: string, value: string) => {
    setLeadTimeInputs((prev) => ({ ...prev, [id]: value }))
  }

  const saveLeadTime = (id: string, value: string) => {
    if (value === '') {
      updateProduct(id, { leadTime: undefined }, true)
      setLeadTimeInputs((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } else {
      const numValue = parseInt(value, 10)
      const validValue = isNaN(numValue) || numValue < 0 ? 0 : numValue
      updateProduct(id, { leadTime: validValue }, true)
      setLeadTimeInputs((prev) => ({ ...prev, [id]: validValue.toString() }))
    }
  }

  const openCalculator = (product: any) => {
    setCalcProduct(product)
    setCalcMargin(40)
    setIsCalcOpen(true)
  }

  const suggestedPrice = useMemo(() => {
    if (!calcProduct) return 0
    if (calcMargin >= 100) return calcProduct.costPrice * 2
    return calcProduct.costPrice / (1 - calcMargin / 100)
  }, [calcProduct, calcMargin])

  const applySuggestedPrice = () => {
    if (calcProduct) {
      updateProduct(calcProduct.id, { price: suggestedPrice })
      toast({
        title: 'Preço atualizado',
        description: `O preço de venda de ${calcProduct.name} foi ajustado para ${formatCurrency(suggestedPrice)}.`,
      })
      setIsCalcOpen(false)
    }
  }

  const replenishmentData = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const dataWithSales = products.map((product) => {
      const sold30d = sales.reduce((acc, sale) => {
        if (new Date(sale.date) >= thirtyDaysAgo && sale.status !== 'Cancelado') {
          const item = sale.items.find((i) => i.product.id === product.id)
          return acc + (item ? item.quantity : 0)
        }
        return acc
      }, 0)

      const revenue30d = sold30d * product.price
      const dailyAvg = sold30d / 30
      const daysOfCover = dailyAvg > 0 ? Math.floor(product.stock / dailyAvg) : Infinity

      const leadTime = product.leadTime || 0
      const targetStock = Math.ceil(Math.max(product.minStock, dailyAvg * (30 + leadTime)))
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

      let purchaseStatus: 'OK' | 'Sugerido' = 'OK'
      if (suggestedPurchase > 0) purchaseStatus = 'Sugerido'

      return {
        ...product,
        sold30d,
        revenue30d,
        dailyAvg,
        daysOfCover,
        stockZeroDate,
        suggestedPurchase,
        healthPercentage,
        status,
        targetStock,
        purchaseStatus,
      }
    })

    const sortedByRevenue = [...dataWithSales].sort((a, b) => b.revenue30d - a.revenue30d)
    const totalRevenue = sortedByRevenue.reduce((acc, p) => acc + p.revenue30d, 0)
    let cumulativeRevenue = 0
    const abcMap = new Map<string, 'A' | 'B' | 'C'>()

    sortedByRevenue.forEach((p) => {
      if (totalRevenue === 0) {
        abcMap.set(p.id, 'C')
        return
      }
      cumulativeRevenue += p.revenue30d
      const cumPerc = cumulativeRevenue / totalRevenue
      if (cumPerc <= 0.8) abcMap.set(p.id, 'A')
      else if (cumPerc <= 0.95) abcMap.set(p.id, 'B')
      else abcMap.set(p.id, 'C')
    })

    return dataWithSales.map((p) => ({
      ...p,
      abcClass: abcMap.get(p.id) || 'C',
    }))
  }, [products, sales])

  const criticalProducts = useMemo(() => {
    return replenishmentData.filter((p) => p.stock <= p.minStock)
  }, [replenishmentData])

  const filteredAndSortedData = useMemo(() => {
    let result = replenishmentData.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm)),
    )
    if (purchaseFilter !== 'all') {
      if (purchaseFilter === 'sugerido') {
        result = result.filter((p) => p.purchaseStatus === 'Sugerido')
      }
    }
    return result.sort((a, b) => {
      if (sortBy === 'urgency') {
        if (a.daysOfCover === b.daysOfCover) return a.stock - b.stock
        return a.daysOfCover - b.daysOfCover
      }
      return a.name.localeCompare(b.name)
    })
  }, [replenishmentData, searchTerm, sortBy, purchaseFilter])

  const summary = useMemo(() => {
    return replenishmentData.reduce(
      (acc, item) => {
        if (item.status === 'critical') acc.critical++
        if (item.purchaseStatus === 'Sugerido') {
          acc.itemsToBuy++
          acc.investment += item.suggestedPurchase * item.costPrice
        }
        return acc
      },
      { critical: 0, itemsToBuy: 0, investment: 0 },
    )
  }, [replenishmentData])

  const filteredPurchases = useMemo(() => {
    return purchases
      .filter((p) => {
        if (historySupplier !== 'all' && p.supplierId !== historySupplier) return false
        if (historyFrom && new Date(p.date) < new Date(historyFrom + 'T00:00:00')) return false
        if (historyTo && new Date(p.date) > new Date(historyTo + 'T23:59:59')) return false
        return true
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [purchases, historyFrom, historyTo, historySupplier])

  const addPurchaseItem = (productId: string) => {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    if (!purchaseItems.find((c) => c.product.id === p.id)) {
      setPurchaseItems([...purchaseItems, { product: p, quantity: 1, costPrice: p.costPrice }])
    }
  }

  const updatePurchaseItem = (id: string, field: 'quantity' | 'costPrice', value: number) => {
    setPurchaseItems((prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, [field]: value } : i)),
    )
  }

  const handleGenerateInstallments = (count: number) => {
    const amountPerInst = newPurchaseTotal / count
    const newInsts = Array.from({ length: count }).map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() + (i + 1) * 30) // +30 days each
      return { dueDate: date.toISOString().split('T')[0], amount: amountPerInst }
    })
    setInstallments(newInsts)
  }

  const handleSavePurchase = () => {
    if (selectedSupplier === 'none' || purchaseItems.length === 0) {
      toast({ variant: 'destructive', title: 'Preencha os campos obrigatórios' })
      return
    }

    const instSum = installments.reduce((acc, curr) => acc + curr.amount, 0)
    if (installments.length === 0 || installments.some((i) => !i.dueDate || i.amount <= 0)) {
      toast({
        variant: 'destructive',
        title: 'Atenção',
        description:
          'É necessário registrar os valores e datas de vencimento para prosseguir com a entrada de mercadoria.',
      })
      return
    }

    if (Math.abs(newPurchaseTotal - instSum) > 0.01) {
      toast({
        variant: 'destructive',
        title: 'Valores Incorretos',
        description: 'A soma das parcelas deve ser exatamente igual ao valor total da nota.',
      })
      return
    }

    const supplierName = suppliers.find((s) => s.id === selectedSupplier)?.name || ''

    const p = addPurchase({
      supplierId: selectedSupplier,
      supplierName,
      items: purchaseItems,
      total: newPurchaseTotal,
    })

    installments.forEach((inst, i) => {
      addPayable({
        supplierId: selectedSupplier,
        supplierName,
        description: `Parcela ${i + 1}/${installments.length} - Compra #${p.id}`,
        amount: inst.amount,
        dueDate: new Date(inst.dueDate).toISOString(),
        purchaseId: p.id,
      })
    })

    setIsNewPurchaseOpen(false)
    setPurchaseItems([])
    setSelectedSupplier('none')
    setInstallments([])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Compras</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Planeje reposições e lance novas entradas de mercadoria.
          </p>
        </div>
        <Button onClick={() => setIsNewPurchaseOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Entrada de Mercadoria
        </Button>
      </div>

      <Tabs defaultValue="planejamento" className="space-y-6">
        <TabsList>
          <TabsTrigger value="planejamento">Planejamento de Reposição</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="planejamento" className="space-y-6">
          {criticalProducts.length > 0 && (
            <Alert
              variant="destructive"
              className="bg-destructive/5 border-destructive/20 text-destructive"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção: Estoque Crítico</AlertTitle>
              <AlertDescription>
                Existem {criticalProducts.length} produto(s) que atingiram ou estão abaixo do
                estoque mínimo. Sugerimos priorizar a reposição desses itens.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-destructive">
                  Estoque Crítico
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{summary.critical}</div>
                <p className="text-xs text-destructive/80 mt-1">Produtos zerados ou &lt; 7 dias</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-primary/20">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Fazer Pedido</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.itemsToBuy}</div>
                <p className="text-xs text-muted-foreground mt-1">Sugestões de reposição</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-primary">
                  Previsão Sugerida
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(summary.investment)}
                </div>
                <p className="text-xs text-primary/80 mt-1">Estimativa p/ novos pedidos</p>
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
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <Select value={purchaseFilter} onValueChange={setPurchaseFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status do Pedido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="sugerido">Sugeridos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'urgency' | 'name')}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
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
                    <TableHead>Produto / ABC</TableHead>
                    <TableHead>Saúde do Estoque</TableHead>
                    <TableHead className="text-center">Vendas (30d) / Média</TableHead>
                    <TableHead className="text-center w-[100px]">Prazo (Dias)</TableHead>
                    <TableHead className="text-center">Cobertura / Fim</TableHead>
                    <TableHead className="text-center w-[240px]">Status da Compra / Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 mb-1.5">
                          SKU: {item.sku}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0',
                            item.abcClass === 'A' &&
                              'bg-emerald-50 text-emerald-700 border-emerald-200',
                            item.abcClass === 'B' && 'bg-blue-50 text-blue-700 border-blue-200',
                            item.abcClass === 'C' && 'bg-slate-50 text-slate-600 border-slate-200',
                          )}
                        >
                          Curva {item.abcClass}
                        </Badge>
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
                      <TableCell className="text-center align-middle">
                        <div className="flex flex-col items-center justify-center gap-1 w-16 mx-auto">
                          <Input
                            type="number"
                            min="0"
                            className="h-8 text-center px-1 text-xs"
                            value={
                              leadTimeInputs[item.id] !== undefined
                                ? leadTimeInputs[item.id]
                                : (item.leadTime ?? '')
                            }
                            placeholder="0"
                            onChange={(e) => handleLeadTimeChange(item.id, e.target.value)}
                            onBlur={(e) => saveLeadTime(item.id, e.target.value)}
                          />
                          {item.leadTime === undefined && (
                            <span
                              className="text-[9px] text-muted-foreground/70 leading-none whitespace-nowrap"
                              title="Calculando com 0 dias"
                            >
                              Padrão: 0
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1.5">
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
                          {item.stockZeroDate && (
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <CalendarClock className="h-3 w-3 text-muted-foreground" />
                              <span
                                className={
                                  item.status === 'critical' ? 'text-destructive font-medium' : ''
                                }
                              >
                                {item.stockZeroDate.toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          {item.purchaseStatus === 'Sugerido' ? (
                            <Badge
                              variant="outline"
                              className="border-primary/50 text-primary px-2"
                            >
                              Sugerido: {item.suggestedPurchase} un
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm flex items-center justify-center">
                              Estoque OK
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCalculator(item)}
                            className="h-8 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            title="Sugerir Preço de Venda Baseado no Custo"
                          >
                            <Calculator className="h-3.5 w-3.5 mr-1.5" /> Preço
                          </Button>
                        </div>
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
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-muted/20 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Data Inicial</Label>
                  <Input
                    type="date"
                    value={historyFrom}
                    onChange={(e) => setHistoryFrom(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Data Final</Label>
                  <Input
                    type="date"
                    value={historyTo}
                    onChange={(e) => setHistoryTo(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Fornecedor</Label>
                  <Select value={historySupplier} onValueChange={setHistorySupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Número/ID</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-center">Qtd Itens</TableHead>
                    <TableHead className="text-right">Total da Compra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(p.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {p.id}
                      </TableCell>
                      <TableCell>{p.supplierName}</TableCell>
                      <TableCell className="text-center">
                        {p.items.reduce((acc, i) => acc + i.quantity, 0)} un
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(p.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPurchases.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma compra finalizada encontrada para os filtros aplicados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Purchase Dialog */}
      <Dialog open={isNewPurchaseOpen} onOpenChange={setIsNewPurchaseOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b shrink-0 bg-muted/10">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Registrar Entrada de Mercadoria
            </DialogTitle>
            <DialogDescription>
              Lance os produtos no estoque e gere as obrigações financeiras para o contas a pagar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x">
            <div className="flex-1 p-6 space-y-6 bg-card">
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione...</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.document})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Adicionar Produtos à Nota</Label>
                <Select onValueChange={addPurchaseItem} value="">
                  <SelectTrigger>
                    <SelectValue placeholder="Buscar produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - Estoque atual: {p.stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="border rounded-md mt-2">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-[100px] text-center">Qtd.</TableHead>
                        <TableHead className="w-[120px] text-right">Custo Un.</TableHead>
                        <TableHead className="w-[100px] text-right">Total</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseItems.map((item) => (
                        <TableRow key={item.product.id}>
                          <TableCell className="py-2">
                            <span className="text-sm font-medium">{item.product.name}</span>
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              type="number"
                              min="1"
                              className="h-8 w-full text-center px-1"
                              value={item.quantity}
                              onChange={(e) =>
                                updatePurchaseItem(
                                  item.product.id,
                                  'quantity',
                                  Number(e.target.value),
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-8 w-full text-right px-1"
                              value={item.costPrice}
                              onChange={(e) =>
                                updatePurchaseItem(
                                  item.product.id,
                                  'costPrice',
                                  Number(e.target.value),
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="py-2 text-right font-medium text-sm">
                            {formatCurrency(item.quantity * item.costPrice)}
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() =>
                                setPurchaseItems((c) =>
                                  c.filter((x) => x.product.id !== item.product.id),
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {purchaseItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            Nenhum produto adicionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[350px] p-6 bg-muted/10 flex flex-col gap-6">
              <div>
                <Label className="text-base font-semibold text-primary">
                  Detalhes Financeiros (Obrigatório)
                </Label>
                <p className="text-xs text-muted-foreground mt-1 mb-4 leading-tight">
                  Toda entrada de estoque gera uma obrigação no Contas a Pagar. Defina os
                  vencimentos abaixo.
                </p>

                <div className="flex justify-between items-center bg-white p-3 rounded-lg border mb-4">
                  <span className="font-semibold text-sm">Total da Compra</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(newPurchaseTotal)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Select
                      defaultValue="1"
                      onValueChange={(v) => handleGenerateInstallments(Number(v))}
                    >
                      <SelectTrigger className="flex-1 bg-white">
                        <SelectValue placeholder="Dividir em..." />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n}x parcelas
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 mt-4 max-h-[250px] overflow-y-auto pr-1">
                    {installments.map((inst, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2 items-center bg-white p-2 rounded border"
                      >
                        <div className="text-xs font-medium w-4 shrink-0 text-muted-foreground">
                          {idx + 1}
                        </div>
                        <Input
                          type="date"
                          className="h-8 px-2 flex-1 text-sm"
                          value={inst.dueDate}
                          onChange={(e) => {
                            const newInst = [...installments]
                            newInst[idx].dueDate = e.target.value
                            setInstallments(newInst)
                          }}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 w-24 text-right px-2 text-sm"
                          value={inst.amount}
                          onChange={(e) => {
                            const newInst = [...installments]
                            newInst[idx].amount = Number(e.target.value)
                            setInstallments(newInst)
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {installments.length > 0 &&
                    Math.abs(
                      newPurchaseTotal - installments.reduce((acc, curr) => acc + curr.amount, 0),
                    ) > 0.01 && (
                      <Alert variant="destructive" className="py-2 px-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-xs font-bold mb-0">Divergência</AlertTitle>
                        <AlertDescription className="text-[10px]">
                          A soma das parcelas (
                          {formatCurrency(installments.reduce((acc, curr) => acc + curr.amount, 0))}
                          ) difere do total.
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-background shrink-0">
            <Button variant="outline" onClick={() => setIsNewPurchaseOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePurchase} className="bg-primary hover:bg-primary/90">
              Confirmar Entrada e Gerar Contas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calc Modal */}
      <Dialog open={isCalcOpen} onOpenChange={setIsCalcOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Calculadora de Preço de Venda</DialogTitle>
            <DialogDescription>
              Defina a margem desejada para calcular o preço sugerido com base no último custo de
              reposição.
            </DialogDescription>
          </DialogHeader>
          {calcProduct && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col gap-1 border-b pb-3">
                <span className="text-sm text-muted-foreground">Produto</span>
                <span className="font-medium">{calcProduct.name}</span>
              </div>
              <div className="flex flex-col gap-1 border-b pb-3">
                <span className="text-sm text-muted-foreground">Custo de Reposição (R$)</span>
                <span className="font-medium">{formatCurrency(calcProduct.costPrice)}</span>
              </div>
              <div className="space-y-2">
                <Label>Margem de Lucro Desejada (%)</Label>
                <Input
                  type="number"
                  value={calcMargin}
                  onChange={(e) => setCalcMargin(Number(e.target.value))}
                  min="0"
                  max="99"
                />
                <p className="text-[10px] text-muted-foreground">
                  Fórmula: Preço Sugerido = Custo / (1 - Margem/100)
                </p>
              </div>
              <div className="flex justify-between items-center p-4 bg-primary/10 border border-primary/20 rounded-lg mt-4">
                <span className="font-semibold text-primary">Preço Sugerido</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(suggestedPrice)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalcOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={applySuggestedPrice}>Aplicar Novo Preço</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
