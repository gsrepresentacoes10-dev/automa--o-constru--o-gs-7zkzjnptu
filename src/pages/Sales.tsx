import { useState } from 'react'
import { useAppContext, Product, SaleItem, Sale } from '@/context/AppContext'
import { formatCurrency, exportSalesToExcel } from '@/lib/utils'
import {
  Search,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  ScanLine,
  Printer,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { PrintableSales } from '@/components/PrintableSales'

export default function Sales() {
  const { products, sales, customers, addSale, cashbackPercentage } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [barcode, setBarcode] = useState('')
  const [cart, setCart] = useState<SaleItem[]>([])

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('none')
  const [useCashback, setUseCashback] = useState(false)

  const [completedSale, setCompletedSale] = useState<Sale | null>(null)

  const filteredProducts = products.filter(
    (p) =>
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
      p.stock > 0,
  )

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast({ variant: 'destructive', title: 'Estoque insuficiente' })
          return prev
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * product.price }
            : item,
        )
      }
      return [...prev, { product, quantity: 1, total: product.price }]
    })
  }

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcode.trim()) return
    const product = products.find(
      (p) => p.sku.toLowerCase() === barcode.toLowerCase() || p.id === barcode,
    )
    if (product) {
      if (product.stock <= 0) {
        toast({ variant: 'destructive', title: 'Produto sem estoque' })
        return
      }
      addToCart(product)
      setBarcode('')
      toast({ title: 'Adicionado: ' + product.name })
    } else {
      toast({
        variant: 'destructive',
        title: 'Não encontrado',
        description: 'Verifique o código de barras.',
      })
    }
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0)
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const availableCashback = selectedCustomer?.cashbackBalance || 0
  const appliedCashback = useCashback ? Math.min(availableCashback, cartTotal) : 0
  const finalTotal = cartTotal - appliedCashback
  const cashbackEarned = finalTotal * (cashbackPercentage / 100)

  const handleCheckout = () => {
    const sale = addSale({
      customerId: selectedCustomerId !== 'none' ? selectedCustomerId : undefined,
      customer: selectedCustomer?.name || 'Consumidor Final',
      items: cart,
      total: finalTotal,
      cashbackUsed: appliedCashback,
      cashbackEarned:
        cashbackEarned > 0 && selectedCustomerId !== 'none' ? cashbackEarned : undefined,
    })
    setCompletedSale(sale)
    setCart([])
    setSelectedCustomerId('none')
    setUseCashback(false)
    setIsCheckoutOpen(false)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PDV (Ponto de Venda)</h1>
          <p className="text-muted-foreground">Busque produtos ou escaneie o código de barras.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportSalesToExcel(sales)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] print:hidden">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form onSubmit={handleBarcodeScan} className="relative">
              <ScanLine className="absolute left-3 top-3 h-5 w-5 text-primary" />
              <Input
                placeholder="Escanear código de barras..."
                className="pl-10 h-12 shadow-sm border-primary/50 focus-visible:ring-primary"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                autoFocus
              />
              <button type="submit" className="hidden" />
            </form>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou SKU..."
                className="pl-10 h-12 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 bg-card border rounded-lg shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border p-3 rounded-lg hover:border-primary cursor-pointer transition-colors flex flex-col justify-between"
                  onClick={() => addToCart(product)}
                >
                  <div>
                    <p className="font-semibold text-sm leading-tight mb-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Estoque: {product.stock} {product.unit}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold text-primary">{formatCurrency(product.price)}</span>
                    <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel: Cart */}
        <Card className="w-full lg:w-[400px] flex flex-col shadow-md">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Carrinho Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                  <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                  <p>O carrinho está vazio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between items-start border-b pb-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm leading-tight">{item.product.name}</p>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.quantity} {item.product.unit} x {formatCurrency(item.product.price)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-2">
                        <span className="font-bold text-sm">{formatCurrency(item.total)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() =>
                            setCart((c) => c.filter((i) => i.product.id !== item.product.id))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex-col gap-4 border-t p-4 bg-muted/10">
            <div className="w-full flex justify-between items-center text-lg">
              <span className="font-semibold text-muted-foreground">Total</span>
              <span className="font-bold text-2xl text-primary">{formatCurrency(cartTotal)}</span>
            </div>
            <Button
              className="w-full h-12 text-lg font-bold"
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
            >
              Avançar para Pagamento
            </Button>
          </CardFooter>
        </Card>
      </div>

      <PrintableSales sales={sales} />

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Cliente (Fidelidade)</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Consumidor Final (Sem Cadastro)</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomer && (
              <div className="bg-emerald-50 p-3 rounded-md border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Cashback Disponível</p>
                  <p className="text-xs text-emerald-600 font-bold">
                    {formatCurrency(availableCashback)}
                  </p>
                </div>
                {availableCashback > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useCashback"
                      checked={useCashback}
                      onCheckedChange={(v) => setUseCashback(v === true)}
                    />
                    <Label
                      htmlFor="useCashback"
                      className="text-sm cursor-pointer text-emerald-800"
                    >
                      Utilizar saldo
                    </Label>
                  </div>
                )}
              </div>
            )}

            <div className="bg-muted p-4 rounded-lg flex flex-col gap-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal:</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              {appliedCashback > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>Desconto Cashback:</span>
                  <span>-{formatCurrency(appliedCashback)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <span className="font-medium text-lg">A Pagar:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
              {cashbackEarned > 0 && selectedCustomerId !== 'none' && (
                <div className="text-right text-xs text-emerald-600 mt-1 font-medium">
                  + {formatCurrency(cashbackEarned)} de cashback gerado
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckout} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog (Thermal Print) */}
      <Dialog open={!!completedSale} onOpenChange={(open) => !open && setCompletedSale(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="print:hidden">
            <DialogTitle>Venda Concluída!</DialogTitle>
          </DialogHeader>
          <div className="thermal-receipt bg-white text-black p-4 text-xs font-mono border rounded-md">
            <div className="text-center font-bold text-base mb-1">CONSTRUMASTER</div>
            <div className="text-center mb-3 text-[10px]">CNPJ: 12.345.678/0001-90</div>
            <div className="border-b border-dashed border-gray-400 mb-2 pb-2 text-[10px]">
              <div>
                Data: {completedSale ? new Date(completedSale.date).toLocaleString('pt-BR') : ''}
              </div>
              <div>Cliente: {completedSale?.customer}</div>
              <div>ID: {completedSale?.id}</div>
            </div>
            <table className="w-full mb-2 text-[10px]">
              <thead>
                <tr className="border-b border-dashed border-gray-400">
                  <th className="text-left font-normal pb-1">Item</th>
                  <th className="text-right font-normal pb-1">Qtd</th>
                  <th className="text-right font-normal pb-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {completedSale?.items.map((item, i) => (
                  <tr key={i}>
                    <td className="truncate max-w-[120px] py-1">{item.product.name}</td>
                    <td className="text-right py-1">{item.quantity}</td>
                    <td className="text-right py-1">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-dashed border-gray-400 pt-2 text-right">
              {completedSale?.cashbackUsed ? (
                <div className="text-[10px] mb-1">
                  Desconto Fid.: -{formatCurrency(completedSale.cashbackUsed)}
                </div>
              ) : null}
              <div className="font-bold text-sm">
                TOTAL R$: {formatCurrency(completedSale?.total || 0)}
              </div>
              {completedSale?.cashbackEarned ? (
                <div className="text-[10px] mt-2 border-t border-dashed border-gray-400 pt-2">
                  Cashback Ganho: {formatCurrency(completedSale.cashbackEarned)}
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => setCompletedSale(null)}>
              Nova Venda
            </Button>
            <Button
              onClick={() => {
                document.body.classList.add('printing-receipt')
                window.print()
                setTimeout(() => document.body.classList.remove('printing-receipt'), 500)
              }}
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
