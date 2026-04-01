import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext, Product, MovementType } from '@/context/AppContext'
import { formatCurrency, cn, exportPurchasesVsEntriesToExcel } from '@/lib/utils'
import {
  Search,
  AlertTriangle,
  Camera,
  AlertOctagon,
  History,
  Plus,
  Truck,
  FileText,
  PackageOpen,
  DollarSign,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal'
import { PrintInventoryModal } from '@/components/PrintInventoryModal'
import { NewPurchaseModal } from '@/components/NewPurchaseModal'
import { ArrowUpRight, TrendingDown } from 'lucide-react'

export default function Inventory() {
  const navigate = useNavigate()
  const {
    products,
    stockMovements,
    addManualStockAdjustment,
    purchaseOrders,
    purchases,
    sales,
    role,
  } = useAppContext()

  const [searchTerm, setSearchTerm] = useState('')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false)

  const [selectedProductHistory, setSelectedProductHistory] = useState<Product | null>(null)
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState<MovementType>('Entrada')
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')

  const [reportPeriod, setReportPeriod] = useState('30')
  const [auditCounts, setAuditCounts] = useState<Record<string, string>>({})

  const productSupplierMap = useMemo(() => {
    const map = new Map<string, string>()
    const sortedPurchases = [...purchases].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    sortedPurchases.forEach((p) => {
      p.items.forEach((i) => {
        map.set(i.product.id, p.supplierName || 'Desconhecido')
      })
    })
    return map
  }, [purchases])

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name))
  }, [products])

  const filteredProducts = sortedProducts.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm))
    )
  })

  const currentProductForHistory = useMemo(() => {
    if (!selectedProductHistory) return null
    return products.find((p) => p.id === selectedProductHistory.id) || selectedProductHistory
  }, [selectedProductHistory, products])

  const productMovements = useMemo(() => {
    if (!selectedProductHistory) return []
    return stockMovements
      .filter((m) => m.productId === selectedProductHistory.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [stockMovements, selectedProductHistory])

  const globalMovements = useMemo(() => {
    return [...stockMovements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }, [stockMovements])

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock > 0 ? p.stock * p.costPrice : 0), 0)
  }, [products])

  const purchasesVsEntriesData = useMemo(() => {
    const days = parseInt(reportPeriod, 10)
    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    const dataMap = new Map<
      string,
      { date: string; volumeComprado: number; volumeEntregue: number }
    >()

    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().split('T')[0]
      dataMap.set(dateStr, { date: dateStr, volumeComprado: 0, volumeEntregue: 0 })
    }

    purchaseOrders.forEach((po) => {
      if (po.orderDate) {
        const d = po.orderDate.split('T')[0]
        if (dataMap.has(d)) {
          dataMap.get(d)!.volumeComprado += po.quantity || 0
        }
      }
    })

    purchases.forEach((p) => {
      const d = p.date.split('T')[0]
      if (dataMap.has(d)) {
        const qty = p.items.reduce((sum, item) => sum + item.quantity, 0)
        dataMap.get(d)!.volumeEntregue += qty
      }
    })

    return Array.from(dataMap.values()).map((d) => ({
      ...d,
      displayDate: new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
    }))
  }, [purchaseOrders, purchases, reportPeriod])

  const chartConfig = {
    volumeComprado: { label: 'Comprado (Pedidos)', color: 'hsl(var(--primary))' },
    volumeEntregue: { label: 'Entregue (Físico)', color: 'hsl(var(--emerald-500))' },
  }

  const handleCameraScan = (barcode: string) => {
    setSearchTerm(barcode)
  }

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductHistory || !adjustmentQuantity || !adjustmentReason) return

    addManualStockAdjustment(
      selectedProductHistory.id,
      adjustmentType,
      Number(adjustmentQuantity),
      adjustmentReason,
    )

    setIsAdjustmentOpen(false)
    setAdjustmentQuantity('')
    setAdjustmentReason('')
  }

  const handleAuditAdjust = (productId: string, physicalCount: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const diff = physicalCount - product.stock
    if (diff === 0) return

    const type = diff > 0 ? 'Entrada' : 'Saída'
    addManualStockAdjustment(productId, type, Math.abs(diff), 'Ajuste de Auditoria')

    setAuditCounts((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  const handlePrintReport = () => {
    window.print()
  }

  const purchaseSuggestions = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentSales = sales.filter(
      (s) => new Date(s.date) >= thirtyDaysAgo && s.status !== 'Cancelado',
    )

    const productSales = new Map<string, number>()
    recentSales.forEach((s) => {
      s.items.forEach((item) => {
        productSales.set(item.product.id, (productSales.get(item.product.id) || 0) + item.quantity)
      })
    })

    return products
      .map((p) => {
        const soldLast30 = productSales.get(p.id) || 0
        const velocityPerDay = soldLast30 / 30

        const daysUntilDepletion = velocityPerDay > 0 ? p.stock / velocityPerDay : Infinity

        let suggestOrder = 0
        if (p.stock <= p.minStock || daysUntilDepletion < 15) {
          suggestOrder = Math.ceil(velocityPerDay * 30 + p.minStock - p.stock)
          if (suggestOrder < 0) suggestOrder = 0
        }

        return {
          product: p,
          velocity: velocityPerDay,
          soldLast30,
          suggestOrder,
        }
      })
      .filter((item) => item.suggestOrder > 0 && item.soldLast30 > 0)
      .sort((a, b) => b.suggestOrder - a.suggestOrder)
  }, [products, sales])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Estoque</h1>
          <p className="text-muted-foreground">
            Monitore níveis de inventário e realize ajustes manuais (Kardex).
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsNewPurchaseOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Nova Entrada de Mercadoria
          </Button>
          <Button
            onClick={() => setIsPrintModalOpen(true)}
            variant="outline"
            className="bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm w-full sm:w-auto"
          >
            <Printer className="h-4 w-4 mr-2" /> Imprimir Inventário
          </Button>
        </div>
      </div>

      <Tabs defaultValue="estoque" className="space-y-6">
        <TabsList className="w-full sm:w-auto overflow-x-auto justify-start border bg-muted/20 print:hidden">
          <TabsTrigger value="estoque">Estoque Físico</TabsTrigger>
          <TabsTrigger value="movimentacoes">Histórico de Movimentações</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria de Inventário</TabsTrigger>
          <TabsTrigger value="relatorio">Compras vs Entradas</TabsTrigger>
          {(role === 'Admin' || role === 'Manager') && (
            <TabsTrigger
              value="sugestoes"
              className="text-blue-600 data-[state=active]:text-blue-700"
            >
              Sugestões de Compra
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="estoque" className="space-y-6 mt-0 print:hidden">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total em Estoque</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
                <p className="text-xs text-muted-foreground">
                  Soma do custo de todos os produtos em estoque
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-muted/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <form onSubmit={handleBarcodeSubmit} className="relative flex gap-2 w-full max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, SKU ou Cód. Barras..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsScannerOpen(true)}
                  title="Escanear com a câmera"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </form>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Últ. Fornecedor</TableHead>
                    <TableHead className="text-right">Preço Venda</TableHead>
                    <TableHead className="text-center">Estoque Atual</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const isOutOfStock = product.stock <= 0
                    const isLow = !isOutOfStock && product.stock <= product.minStock

                    const pendingOrder = purchaseOrders.find(
                      (po) => po.productId === product.id && po.status === 'Aguardando Chegada',
                    )

                    const supplier = productSupplierMap.get(product.id) || '-'

                    return (
                      <TableRow
                        key={product.id}
                        className={
                          isOutOfStock
                            ? 'bg-destructive/10 hover:bg-destructive/20 transition-colors'
                            : isLow
                              ? 'bg-amber-500/5 hover:bg-amber-500/10 transition-colors'
                              : ''
                        }
                      >
                        <TableCell>
                          <div className="font-medium flex items-center gap-2">
                            {product.name}
                            {(isOutOfStock || isLow) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => navigate('/compras')}
                                      className={cn(
                                        'inline-flex items-center justify-center transition-colors rounded-full p-1',
                                        isOutOfStock
                                          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                                          : 'bg-amber-100 text-amber-600 hover:bg-amber-200',
                                      )}
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="right"
                                    className={cn(
                                      'shadow-lg border',
                                      isOutOfStock
                                        ? 'bg-destructive text-destructive-foreground border-destructive/20'
                                        : 'bg-amber-100 text-amber-900 border-amber-200',
                                    )}
                                  >
                                    <p className="font-bold mb-1">
                                      {isOutOfStock ? 'Sem Estoque' : 'Estoque Crítico'}
                                    </p>
                                    <p className="text-xs mb-2">
                                      Sugerida a reposição imediata deste item.
                                    </p>
                                    <div
                                      className={cn(
                                        'text-xs font-bold flex items-center gap-1',
                                        isOutOfStock
                                          ? 'text-destructive-foreground/90'
                                          : 'text-amber-700',
                                      )}
                                    >
                                      <span>Clique para Nova Compra</span>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {product.isEssential && (
                              <Badge
                                variant="destructive"
                                className="h-4 px-1 py-0 text-[9px] bg-red-100 text-red-700 border-red-200"
                              >
                                Essencial
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 font-normal"
                            >
                              SKU: {product.sku}
                            </Badge>
                            {product.barcode && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-4 bg-muted font-normal text-muted-foreground border-transparent"
                              >
                                EAN: {product.barcode}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal text-xs">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className="text-xs text-muted-foreground truncate max-w-[140px] inline-block"
                            title={supplier}
                          >
                            {supplier}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(product.price)}
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <div className="flex flex-col items-center justify-center">
                            <div
                              className={cn(
                                'px-3 py-1 rounded-md border flex items-baseline gap-1',
                                isOutOfStock
                                  ? 'bg-destructive/20 border-destructive/30 text-destructive'
                                  : isLow
                                    ? 'bg-amber-100 border-amber-200 text-amber-700'
                                    : 'bg-muted/50 border-transparent',
                              )}
                            >
                              <span className="text-lg font-bold leading-none">
                                {product.stock}
                              </span>
                              <span className="text-[10px] font-medium opacity-80 leading-none">
                                {product.unit}
                              </span>
                            </div>
                            <p
                              className={cn(
                                'text-[10px] mt-1 font-medium',
                                isOutOfStock || isLow
                                  ? 'text-destructive'
                                  : 'text-muted-foreground',
                              )}
                            >
                              Mínimo: {product.minStock}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            {isOutOfStock ? (
                              <div className="flex items-center justify-center text-white text-[11px] font-bold gap-1 bg-destructive py-1 px-2.5 rounded-md w-fit mx-auto shadow-sm">
                                <AlertOctagon className="h-3.5 w-3.5" /> Sem Estoque
                              </div>
                            ) : isLow ? (
                              <div className="flex items-center justify-center text-amber-700 text-[11px] font-bold gap-1 bg-amber-100 py-1 px-2.5 rounded-full w-fit mx-auto border border-amber-200 shadow-sm">
                                <AlertTriangle className="h-3.5 w-3.5" /> Estoque Baixo
                              </div>
                            ) : (
                              <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                                <PackageOpen className="h-4 w-4" /> Normal
                              </span>
                            )}

                            {pendingOrder && (
                              <div className="flex flex-col items-center gap-1 border-t border-border/50 pt-2 mt-1 w-full max-w-[140px]">
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0.5 whitespace-nowrap"
                                >
                                  <Truck className="w-3 h-3 mr-1" />
                                  Chega:{' '}
                                  {new Date(pendingOrder.expectedDeliveryDate).toLocaleDateString(
                                    'pt-BR',
                                  )}
                                </Badge>
                                {pendingOrder.documentUrl && (
                                  <a
                                    href={pendingOrder.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1 w-full truncate"
                                    title="Ver comprovante do pedido"
                                  >
                                    <FileText className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">Ver Pedido</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProductHistory(product)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                          >
                            <History className="h-4 w-4 mr-2" /> Kardex
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <PackageOpen className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        Nenhum produto encontrado com os filtros atuais.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="movimentacoes" className="space-y-6 mt-0 print:hidden">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Geral de Movimentações</CardTitle>
              <CardDescription>
                Auditoria completa de todas as entradas, saídas e ajustes no estoque por todos os
                usuários.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10">
                    <TableRow>
                      <TableHead className="w-[150px]">Data/Hora</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead>Origem / Documento</TableHead>
                      <TableHead>Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {globalMovements.map((mov) => {
                      const prod = products.find((p) => p.id === mov.productId)
                      return (
                        <TableRow key={mov.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {format(new Date(mov.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {prod?.name || 'Produto Excluído'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={mov.type === 'Entrada' ? 'default' : 'secondary'}
                              className={cn(
                                mov.type === 'Entrada'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                                  : 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
                                'text-[10px] px-2 py-0.5',
                              )}
                            >
                              {mov.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm">
                            <span
                              className={
                                mov.type === 'Entrada' ? 'text-emerald-600' : 'text-orange-600'
                              }
                            >
                              {mov.type === 'Entrada' ? '+' : '-'}
                              {mov.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {mov.origin}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {mov.userName || 'Sistema'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {globalMovements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma movimentação registrada no sistema.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-6 mt-0 print:hidden">
          <Card>
            <CardHeader>
              <CardTitle>Auditoria de Inventário (Rotativo)</CardTitle>
              <CardDescription>
                Realize a contagem física dos produtos e registre discrepâncias para manter a
                acurácia do seu estoque em dia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border-b bg-muted/20 mb-4 rounded-md">
                <div className="relative max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto para auditar..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Saldo Sistema</TableHead>
                      <TableHead className="text-center w-36">Saldo Físico</TableHead>
                      <TableHead className="text-center w-32">Divergência</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const physicalCountStr = auditCounts[product.id]
                      const physicalCount =
                        physicalCountStr !== undefined && physicalCountStr !== ''
                          ? Number(physicalCountStr)
                          : null
                      const diff = physicalCount !== null ? physicalCount - product.stock : null

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-muted-foreground">{product.stock}</span>{' '}
                            <span className="text-xs">{product.unit}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="0"
                              placeholder="Contagem"
                              value={physicalCountStr || ''}
                              onChange={(e) =>
                                setAuditCounts((prev) => ({
                                  ...prev,
                                  [product.id]: e.target.value,
                                }))
                              }
                              className="text-center h-9"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {diff !== null && (
                              <span
                                className={cn(
                                  'font-bold px-2 py-1 rounded-md text-sm',
                                  diff > 0
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : diff < 0
                                      ? 'bg-destructive/10 text-destructive'
                                      : 'text-muted-foreground',
                                )}
                              >
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            {diff !== null && diff !== 0 ? (
                              <Button
                                size="sm"
                                onClick={() => handleAuditAdjust(product.id, physicalCount!)}
                              >
                                Ajustar Inventário
                              </Button>
                            ) : diff === 0 ? (
                              <div className="flex items-center justify-end text-emerald-600 text-sm font-medium">
                                <CheckCircle2 className="w-4 h-4 mr-1" /> OK
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum produto encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorio" className="space-y-6 mt-0 print:m-0 print:p-0">
          <div className="hidden print:block w-full text-black mb-6 border-b pb-4 border-black">
            <h1 className="text-2xl font-bold uppercase tracking-wider">
              Relatório de Compras vs. Entradas
            </h1>
            <div className="mt-2 text-sm space-y-1">
              <p>
                <strong>Data da Geração:</strong>{' '}
                {new Date().toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p>
                <strong>Período Coberto:</strong> Últimos {reportPeriod} dias
              </p>
            </div>
          </div>

          <Card className="print:shadow-none print:border-none">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
              <div>
                <CardTitle>Relatório de Compras vs. Entradas</CardTitle>
                <CardDescription>
                  Comparativo do volume de itens solicitados x itens efetivamente recebidos no
                  estoque.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="15">Últimos 15 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handlePrintReport}>
                  <FileText className="h-4 w-4 mr-2" /> Exportar PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    exportPurchasesVsEntriesToExcel(purchasesVsEntriesData, reportPeriod)
                  }
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-8">
                <ChartContainer config={chartConfig} className="h-[350px] w-full print:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={purchasesVsEntriesData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="volumeComprado"
                        fill="var(--color-volumeComprado)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="volumeEntregue"
                        fill="var(--color-volumeEntregue)"
                        radius={[4, 4, 0, 0]}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              <div className="border rounded-lg overflow-hidden print:border-black print:border">
                <Table>
                  <TableHeader className="bg-muted/50 print:bg-gray-100">
                    <TableRow className="print:border-black">
                      <TableHead className="print:text-black font-bold">Data</TableHead>
                      <TableHead className="text-right print:text-black font-bold">
                        Volume Comprado (Pedidos)
                      </TableHead>
                      <TableHead className="text-right print:text-black font-bold">
                        Volume Entregue (Físico)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchasesVsEntriesData.map((dataRow, idx) => (
                      <TableRow key={idx} className="print:border-black">
                        <TableCell className="font-medium print:text-black">
                          {dataRow.displayDate}
                        </TableCell>
                        <TableCell className="text-right print:text-black">
                          {dataRow.volumeComprado}
                        </TableCell>
                        <TableCell className="text-right print:text-black">
                          {dataRow.volumeEntregue}
                        </TableCell>
                      </TableRow>
                    ))}
                    {purchasesVsEntriesData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          Nenhum dado no período.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {(role === 'Admin' || role === 'Manager') && (
          <TabsContent value="sugestoes" className="space-y-6 mt-0 print:hidden">
            <Card className="border-blue-200 shadow-sm">
              <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" /> Sugestões de Reposição Automática
                </CardTitle>
                <CardDescription className="text-blue-600/80">
                  Baseado na velocidade de vendas dos últimos 30 dias e estoque atual. Somente
                  produtos com giro são analisados.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 p-0 overflow-auto">
                <Table>
                  <TableHeader className="bg-blue-50/30">
                    <TableRow>
                      <TableHead className="pl-6">Produto / SKU</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Estoque Atual</TableHead>
                      <TableHead className="text-center">Giro (Un/Dia)</TableHead>
                      <TableHead className="text-right pr-6">Sugestão de Compra</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseSuggestions.map(({ product, velocity, suggestOrder }) => (
                      <TableRow key={product.id} className="hover:bg-blue-50/20">
                        <TableCell className="pl-6">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">{product.sku}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              'font-bold',
                              product.stock <= product.minStock ? 'text-destructive' : '',
                            )}
                          >
                            {product.stock}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">{product.unit}</span>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {velocity.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2 text-blue-700 font-bold">
                            {suggestOrder}{' '}
                            <span className="text-xs font-normal opacity-80">{product.unit}</span>
                            <ArrowUpRight className="h-4 w-4" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {purchaseSuggestions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Seu estoque está saudável! Nenhuma reposição crítica sugerida no momento.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Sheet
        open={!!selectedProductHistory}
        onOpenChange={(open) => !open && setSelectedProductHistory(null)}
      >
        <SheetContent className="sm:max-w-[700px] w-[90vw] flex flex-col gap-0 p-0">
          <SheetHeader className="p-6 pb-4 border-b bg-muted/10">
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" /> Histórico de Movimentações (Kardex)
            </SheetTitle>
            <SheetDescription>
              Acompanhe a trilha de auditoria do produto:{' '}
              <strong className="text-foreground">{currentProductForHistory?.name}</strong> (SKU:{' '}
              {currentProductForHistory?.sku})
            </SheetDescription>
          </SheetHeader>
          <div className="p-6 flex-1 flex flex-col overflow-hidden gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border p-4 rounded-lg shadow-sm">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Saldo Físico Atual
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-primary">
                    {currentProductForHistory?.stock}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {currentProductForHistory?.unit}
                  </span>
                </div>
              </div>
              <Button
                onClick={() => setIsAdjustmentOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" /> Novo Ajuste Manual
              </Button>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden flex flex-col shadow-sm">
              <ScrollArea className="flex-1 bg-white">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10 shadow-sm">
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead>Origem / Documento</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productMovements.map((mov) => (
                      <TableRow key={mov.id} className="hover:bg-muted/30">
                        <TableCell className="whitespace-nowrap text-xs font-medium">
                          {format(new Date(mov.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={mov.type === 'Entrada' ? 'default' : 'secondary'}
                            className={cn(
                              'text-[10px] px-2 py-0.5',
                              mov.type === 'Entrada'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200'
                                : 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200',
                            )}
                          >
                            {mov.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm">
                          <span
                            className={
                              mov.type === 'Entrada' ? 'text-emerald-600' : 'text-orange-600'
                            }
                          >
                            {mov.type === 'Entrada' ? '+' : '-'}
                            {mov.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs leading-tight">
                          {mov.origin}
                          {mov.userName && (
                            <span className="block mt-0.5 text-[10px] font-medium">
                              Por: {mov.userName}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-black text-sm">
                          {mov.balanceAfter}
                        </TableCell>
                      </TableRow>
                    ))}
                    {productMovements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhuma movimentação registrada no sistema.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAdjustmentSubmit}>
            <DialogHeader>
              <DialogTitle>Ajuste Físico de Estoque</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="bg-muted/50 p-3 rounded-md text-sm mb-2 border border-border/50">
                <p>
                  <strong>Produto:</strong> {currentProductForHistory?.name}
                </p>
                <p className="mt-1">
                  <strong>Saldo Atual:</strong> {currentProductForHistory?.stock}{' '}
                  {currentProductForHistory?.unit}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Movimento</Label>
                <Select
                  value={adjustmentType}
                  onValueChange={(v) => setAdjustmentType(v as MovementType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada (+ Acréscimo)</SelectItem>
                    <SelectItem value="Saída">Saída (- Dedução)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade a ajustar</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  placeholder="Ex: 5"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Motivo da Movimentação <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="Ex: Quebra, Perda, Acerto de Inventário"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Salvar Movimentação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BarcodeScannerModal
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleCameraScan}
      />

      <PrintInventoryModal
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        products={products}
      />

      <NewPurchaseModal open={isNewPurchaseOpen} onOpenChange={setIsNewPurchaseOpen} />
    </div>
  )
}
