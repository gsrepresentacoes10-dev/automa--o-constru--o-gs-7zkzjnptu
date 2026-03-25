import { useState, useMemo } from 'react'
import { useAppContext, Product, MovementType } from '@/context/AppContext'
import { formatCurrency, cn } from '@/lib/utils'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal'
import { PrintInventoryModal } from '@/components/PrintInventoryModal'

export default function Inventory() {
  const { products, stockMovements, addManualStockAdjustment, purchaseOrders, purchases } =
    useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)

  const [selectedProductHistory, setSelectedProductHistory] = useState<Product | null>(null)
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState<MovementType>('Entrada')
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')

  // Compute the last supplier for each product based on purchase history
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

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock > 0 ? p.stock * p.costPrice : 0), 0)
  }, [products])

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Estoque</h1>
          <p className="text-muted-foreground">
            Monitore níveis de inventário e realize ajustes manuais (Kardex).
          </p>
        </div>
        <Button
          onClick={() => setIsPrintModalOpen(true)}
          variant="outline"
          className="bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm w-full sm:w-auto"
        >
          <Printer className="h-4 w-4 mr-2" /> Imprimir Inventário
        </Button>
      </div>

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
                      <p className="font-medium">{product.name}</p>
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
                          <span className="text-lg font-bold leading-none">{product.stock}</span>
                          <span className="text-[10px] font-medium opacity-80 leading-none">
                            {product.unit}
                          </span>
                        </div>
                        <p
                          className={cn(
                            'text-[10px] mt-1 font-medium',
                            isOutOfStock || isLow ? 'text-destructive' : 'text-muted-foreground',
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
    </div>
  )
}
