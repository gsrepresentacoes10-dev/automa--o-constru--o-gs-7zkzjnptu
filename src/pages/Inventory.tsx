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
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

export default function Inventory() {
  const { products, stockMovements, addManualStockAdjustment, purchaseOrders } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCriticalOnly, setShowCriticalOnly] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  const [selectedProductHistory, setSelectedProductHistory] = useState<Product | null>(null)
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState<MovementType>('Entrada')
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name))
  }, [products])

  const filteredProducts = sortedProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm))

    if (showCriticalOnly) {
      return matchesSearch && p.stock <= p.minStock
    }
    return matchesSearch
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
          <h1 className="text-2xl font-bold tracking-tight">Consulta de Estoque</h1>
          <p className="text-muted-foreground">
            Monitore os materiais disponíveis, acompanhe alertas e acesse o Kardex.
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="critical-stock"
              checked={showCriticalOnly}
              onCheckedChange={(c) => setShowCriticalOnly(c as boolean)}
            />
            <Label
              htmlFor="critical-stock"
              className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Mostrar apenas estoque crítico
            </Label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
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

                return (
                  <TableRow
                    key={product.id}
                    className={isOutOfStock ? 'bg-destructive/10' : isLow ? 'bg-amber-500/5' : ''}
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
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="text-center align-middle">
                      <div className="flex flex-col items-center justify-center">
                        <div>
                          <span
                            className={cn(
                              'text-base',
                              isOutOfStock || isLow ? 'font-bold text-destructive' : '',
                            )}
                          >
                            {product.stock}
                          </span>{' '}
                          <span className="text-xs text-muted-foreground">{product.unit}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Mín: {product.minStock}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        {isOutOfStock ? (
                          <div className="flex items-center justify-center text-white text-xs font-bold gap-1 bg-destructive py-1 px-2 rounded-md w-fit mx-auto shadow-sm">
                            <AlertOctagon className="h-3 w-3" /> Sem Estoque
                          </div>
                        ) : isLow ? (
                          <div className="flex items-center justify-center text-amber-700 text-xs font-bold gap-1 bg-amber-100 py-1 px-2 rounded-full w-fit mx-auto border border-amber-200">
                            <AlertTriangle className="h-3 w-3" /> Estoque Baixo
                          </div>
                        ) : (
                          <span className="text-emerald-600 text-sm font-medium">Normal</span>
                        )}

                        {pendingOrder && (
                          <div className="flex flex-col items-center gap-1 border-t pt-2 mt-1 w-full max-w-[140px]">
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
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        <History className="h-4 w-4 mr-2" /> Histórico
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle>Histórico de Movimentações (Kardex)</SheetTitle>
            <SheetDescription>
              Produto: <strong className="text-foreground">{currentProductForHistory?.name}</strong>{' '}
              (SKU: {currentProductForHistory?.sku})
            </SheetDescription>
          </SheetHeader>
          <div className="p-6 flex-1 flex flex-col overflow-hidden gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="bg-muted px-4 py-2 rounded-md border flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Saldo Atual:</span>
                <span className="text-lg font-bold">
                  {currentProductForHistory?.stock}{' '}
                  <span className="text-xs text-muted-foreground">
                    {currentProductForHistory?.unit}
                  </span>
                </span>
              </div>
              <Button
                onClick={() => setIsAdjustmentOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" /> Ajuste Manual
              </Button>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 bg-card">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10">
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead>Origem/Motivo</TableHead>
                      <TableHead className="text-right">Saldo Resultante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productMovements.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(mov.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={mov.type === 'Entrada' ? 'default' : 'secondary'}
                            className={
                              mov.type === 'Entrada'
                                ? 'bg-emerald-500 hover:bg-emerald-600'
                                : 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200'
                            }
                          >
                            {mov.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span
                            className={
                              mov.type === 'Entrada' ? 'text-emerald-600' : 'text-orange-600'
                            }
                          >
                            {mov.type === 'Entrada' ? '+' : '-'}
                            {mov.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {mov.origin}
                        </TableCell>
                        <TableCell className="text-right font-bold">{mov.balanceAfter}</TableCell>
                      </TableRow>
                    ))}
                    {productMovements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhuma movimentação registrada.
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
              <DialogTitle>Novo Ajuste Manual</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
                    <SelectItem value="Entrada">Entrada (Acrescentar saldo)</SelectItem>
                    <SelectItem value="Saída">Saída (Diminuir saldo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Motivo / Observação <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="Ex: Quebra, Perda, Correção de Inventário"
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
                Salvar Ajuste
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
    </div>
  )
}

