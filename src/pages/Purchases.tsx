import { useState, useMemo } from 'react'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Search,
  AlertTriangle,
  TrendingUp,
  CalendarClock,
  ShoppingCart,
  Upload,
  CheckCircle2,
  Clock,
  CalendarIcon,
  FileText,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

export default function Purchases() {
  const { products, sales, purchaseOrders, addPurchaseOrder, suppliers, addPurchase } =
    useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'urgency' | 'name'>('urgency')
  const [purchaseFilter, setPurchaseFilter] = useState<string>('all')

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [orderQuantity, setOrderQuantity] = useState<number>(0)
  const [expectedDate, setExpectedDate] = useState<Date | undefined>(undefined)
  const [orderFile, setOrderFile] = useState<File | null>(null)

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

      const latestOrder = purchaseOrders
        .filter((po) => po.productId === product.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

      let purchaseStatus: 'OK' | 'Sugerido' | 'Aguardando Chegada' | 'Entrada Realizada' = 'OK'
      let orderInfo = null

      if (latestOrder) {
        if (latestOrder.status === 'Aguardando Chegada') {
          purchaseStatus = 'Aguardando Chegada'
          orderInfo = latestOrder
        } else if (latestOrder.status === 'Entrada Realizada') {
          const daysSince =
            (new Date().getTime() - new Date(latestOrder.createdAt).getTime()) / (1000 * 3600 * 24)
          if (daysSince <= 7) {
            purchaseStatus = 'Entrada Realizada'
            orderInfo = latestOrder
          } else if (suggestedPurchase > 0) {
            purchaseStatus = 'Sugerido'
          }
        }
      } else if (suggestedPurchase > 0) {
        purchaseStatus = 'Sugerido'
      }

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
        purchaseStatus,
        orderInfo,
      }
    })
  }, [products, sales, purchaseOrders])

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
      } else if (purchaseFilter === 'aguardando') {
        result = result.filter((p) => p.purchaseStatus === 'Aguardando Chegada')
      } else if (purchaseFilter === 'recebido') {
        result = result.filter((p) => p.purchaseStatus === 'Entrada Realizada')
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
        if (item.purchaseStatus === 'Aguardando Chegada') {
          acc.awaiting++
        }
        return acc
      },
      { critical: 0, itemsToBuy: 0, investment: 0, awaiting: 0 },
    )
  }, [replenishmentData])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setOrderFile(e.target.files[0])
    }
  }

  const openOrderModal = (product: any) => {
    setSelectedProduct(product)
    setOrderQuantity(product.suggestedPurchase || 0)
    setExpectedDate(undefined)
    setOrderFile(null)
    setIsOrderModalOpen(true)
  }

  const handlePlaceOrder = () => {
    if (!selectedProduct || !expectedDate || !orderFile) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos e anexe o documento.',
        variant: 'destructive',
      })
      return
    }

    const fileUrl = URL.createObjectURL(orderFile)

    addPurchaseOrder({
      productId: selectedProduct.id,
      quantity: orderQuantity,
      expectedDeliveryDate: expectedDate.toISOString(),
      documentName: orderFile.name,
      documentUrl: fileUrl,
    })
    setIsOrderModalOpen(false)
  }

  const handleReceiveOrder = (product: any, orderInfo: any) => {
    const defaultSupplier = suppliers[0]
    addPurchase({
      supplierId: defaultSupplier?.id || '1',
      supplierName: defaultSupplier?.name || 'Fornecedor Padrão',
      items: [
        {
          product: product,
          quantity: orderInfo.quantity,
          costPrice: product.costPrice,
        },
      ],
      total: orderInfo.quantity * product.costPrice,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planejamento de Reposição</h1>
          <p className="text-muted-foreground">
            Acompanhe pedidos de compra, cobertura preditiva e fluxo de estoque.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-destructive">Estoque Crítico</CardTitle>
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
        <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-amber-600">Aguardando Chegada</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summary.awaiting}</div>
            <p className="text-xs text-amber-600/80 mt-1">Pedidos em trânsito</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-primary">Previsão Sugerida</CardTitle>
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
                <SelectItem value="aguardando">Aguardando Chegada</SelectItem>
                <SelectItem value="recebido">Entrada Realizada</SelectItem>
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
                <TableHead>Produto</TableHead>
                <TableHead>Saúde do Estoque</TableHead>
                <TableHead className="text-center">Vendas (30d) / Média</TableHead>
                <TableHead className="text-center">Cobertura / Fim</TableHead>
                <TableHead className="text-center w-[220px]">Status da Compra / Ação</TableHead>
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
                    {item.purchaseStatus === 'Sugerido' && (
                      <div className="flex flex-col items-center gap-2">
                        <Badge variant="outline" className="border-primary/50 text-primary">
                          Sugerido: {item.suggestedPurchase} un
                        </Badge>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs w-full max-w-[140px]"
                          onClick={() => openOrderModal(item)}
                        >
                          Registrar Pedido
                        </Button>
                      </div>
                    )}
                    {item.purchaseStatus === 'Aguardando Chegada' && (
                      <div className="flex flex-col items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 border-amber-200 whitespace-nowrap"
                        >
                          <Clock className="w-3 h-3 mr-1" /> Aguardando Chegada
                        </Badge>
                        <div className="text-[10px] text-muted-foreground flex flex-col items-center w-full gap-0.5">
                          <span>Qtd: {item.orderInfo?.quantity} un</span>
                          <span className="font-medium text-amber-900">
                            Prev:{' '}
                            {item.orderInfo?.expectedDeliveryDate &&
                              new Date(item.orderInfo.expectedDeliveryDate).toLocaleDateString(
                                'pt-BR',
                              )}
                          </span>
                          {item.orderInfo?.documentName && (
                            <a
                              href={item.orderInfo.documentUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[150px] flex items-center justify-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded mt-1"
                              title={item.orderInfo.documentName}
                            >
                              <FileText className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{item.orderInfo.documentName}</span>
                            </a>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs w-full max-w-[140px] mt-1"
                          onClick={() => handleReceiveOrder(item, item.orderInfo)}
                        >
                          Simular Entrada (NF)
                        </Button>
                      </div>
                    )}
                    {item.purchaseStatus === 'Entrada Realizada' && (
                      <div className="flex flex-col items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-800 border-emerald-200 whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Recebido
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          Última Entrada: {item.orderInfo?.quantity} un
                        </span>
                      </div>
                    )}
                    {item.purchaseStatus === 'OK' && (
                      <span className="text-muted-foreground text-sm flex items-center justify-center">
                        Estoque OK
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredAndSortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pedido de Compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <div className="text-sm font-medium p-2 bg-muted rounded-md">
                {selectedProduct?.name}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quantidade a Pedir</Label>
              <Input
                type="number"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Number(e.target.value))}
                min={1}
              />
              <p className="text-xs text-muted-foreground">
                Sugestão do sistema: {selectedProduct?.suggestedPurchase} un
              </p>
            </div>
            <div className="space-y-2 flex flex-col">
              <Label>Data de Previsão de Entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !expectedDate && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expectedDate ? (
                      format(expectedDate, 'PPP', { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expectedDate}
                    onSelect={setExpectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Anexar Documento do Pedido (PDF/Imagem)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  id="order-doc"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,image/*"
                />
                <Button variant="outline" className="w-full" asChild>
                  <label
                    htmlFor="order-doc"
                    className="cursor-pointer flex items-center justify-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {orderFile ? orderFile.name : 'Escolher Arquivo'}
                  </label>
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePlaceOrder}>Salvar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
