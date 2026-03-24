import { useState, useMemo } from 'react'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Search, AlertTriangle, Camera, AlertOctagon } from 'lucide-react'
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
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal'

export default function Inventory() {
  const { products } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCriticalOnly, setShowCriticalOnly] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

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

  const handleCameraScan = (barcode: string) => {
    setSearchTerm(barcode)
  }

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For USB scanners, the default form submission is prevented here.
    // The searchTerm state will already have the rapid input from the scanner.
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consulta de Estoque</h1>
          <p className="text-muted-foreground">
            Monitore os materiais disponíveis e acompanhe alertas de estoque.
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock === 0
                const isLow = !isOutOfStock && product.stock <= product.minStock

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
                    <TableCell className="text-center">
                      <span className={isOutOfStock || isLow ? 'font-bold text-destructive' : ''}>
                        {product.stock}
                      </span>{' '}
                      <span className="text-xs text-muted-foreground">{product.unit}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Mín: {product.minStock}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
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
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <BarcodeScannerModal
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleCameraScan}
      />
    </div>
  )
}
