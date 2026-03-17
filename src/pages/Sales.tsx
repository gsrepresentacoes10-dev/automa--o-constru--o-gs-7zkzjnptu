import { useState } from 'react'
import { useAppContext, Product, SaleItem, Sale, PaymentMethod } from '@/context/AppContext'
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
  Minus,
  Plus,
  QrCode,
  Copy,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Sales() {
  const { products, sales, customers, addSale, cashbackPercentage } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [barcode, setBarcode] = useState('')
  const [cart, setCart] = useState<SaleItem[]>([])

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('none')
  const [useCashback, setUseCashback] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Dinheiro')

  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState<string>('')

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

  const updateQuantity = (productId: string, newQuantity: number, fromInput = false) => {
    if (newQuantity < 0) return

    if (newQuantity === 0 && !fromInput) {
      setCart((c) => c.filter((i) => i.product.id !== productId))
      return
    }

    const product = products.find((p) => p.id === productId)
    if (!product) return

    if (newQuantity > product.stock) {
      toast({
        variant: 'destructive',
        title: 'Estoque insuficiente',
        description: `O estoque atual é de ${product.stock} ${product.unit}.`,
      })
      newQuantity = product.stock
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.product.price }
          : item,
      ),
    )
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
  const hasValidItems = cart.some((item) => item.quantity > 0)

  const discountNum = Number(discountValue) || 0
  const calculatedDiscount =
    discountType === 'percent' ? cartTotal * (discountNum / 100) : discountNum
  const cartTotalWithDiscount = Math.max(0, cartTotal - calculatedDiscount)

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const availableCashback = selectedCustomer?.cashbackBalance || 0
  const appliedCashback = useCashback ? Math.min(availableCashback, cartTotalWithDiscount) : 0
  const finalTotal = cartTotalWithDiscount - appliedCashback
  const cashbackEarned = finalTotal * (cashbackPercentage / 100)

  const copyPixCode = () => {
    navigator.clipboard.writeText('00020126580014br.gov.bcb.pix0136-mock-code-1234')
    toast({ title: 'Código PIX copiado com sucesso!' })
  }

  const handleCheckout = () => {
    if (paymentMethod === 'Venda a Prazo' && selectedCustomerId === 'none') {
      toast({
        variant: 'destructive',
        title: 'Cliente obrigatório',
        description: 'Para Venda a Prazo, é obrigatório selecionar um cliente cadastrado.',
      })
      return
    }

    const validItems = cart.filter((i) => i.quantity > 0)

    if (validItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Carrinho vazio',
        description: 'Adicione produtos com quantidade maior que zero.',
      })
      return
    }

    const sale = addSale({
      customerId: selectedCustomerId !== 'none' ? selectedCustomerId : undefined,
      customer: selectedCustomer?.name || 'Consumidor Final',
      items: validItems,
      total: finalTotal,
      discount: calculatedDiscount > 0 ? calculatedDiscount : undefined,
      cashbackUsed: appliedCashback,
      cashbackEarned:
        cashbackEarned > 0 && selectedCustomerId !== 'none' ? cashbackEarned : undefined,
      paymentMethod,
    })
    setCompletedSale(sale)
    setCart([])
    setSelectedCustomerId('none')
    setUseCashback(false)
    setDiscountValue('')
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
                      <div className="flex-1 pr-2">
                        <p className="font-medium text-sm leading-tight">{item.product.name}</p>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(item.product.price)} / {item.product.unit}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            className="h-8 w-16 text-center px-1 text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === '') {
                                updateQuantity(item.product.id, 0, true)
                              } else {
                                const num = parseInt(val, 10)
                                if (!isNaN(num)) {
                                  updateQuantity(item.product.id, num, true)
                                }
                              }
                            }}
                            onBlur={() => {
                              if (item.quantity === 0) {
                                setCart((c) => c.filter((i) => i.product.id !== item.product.id))
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
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
            {cart.length > 0 && (
              <div className="p-4 border-t bg-muted/5 space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Aplicar Desconto</Label>
                  <div className="flex items-center gap-2">
                    <Tabs
                      value={discountType}
                      onValueChange={(v) => setDiscountType(v as 'percent' | 'fixed')}
                      className="w-[120px]"
                    >
                      <TabsList className="grid w-full grid-cols-2 h-9">
                        <TabsTrigger value="percent" className="text-xs">
                          %
                        </TabsTrigger>
                        <TabsTrigger value="fixed" className="text-xs">
                          R$
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Input
                      type="number"
                      placeholder="0"
                      className="h-9"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-4 border-t p-4 bg-muted/10">
            <div className="w-full flex justify-between items-center text-lg">
              <span className="font-semibold text-muted-foreground">Total Geral</span>
              <span className="font-bold text-2xl text-primary">
                {formatCurrency(cartTotalWithDiscount)}
              </span>
            </div>
            <Button
              className="w-full h-12 text-lg font-bold"
              disabled={!hasValidItems}
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Cliente (Fidelidade / Prazo)</Label>
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

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Venda a Prazo">Venda a Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'PIX' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col items-center text-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-emerald-100">
                  <QrCode className="w-32 h-32 text-emerald-950" strokeWidth={1.5} />
                </div>
                <div className="space-y-1.5 w-full">
                  <p className="text-sm font-semibold text-emerald-900">QR Code PIX Gerado</p>
                  <p className="text-xs text-emerald-700">Aguardando pagamento do cliente</p>
                  <div className="flex gap-2 mt-2 w-full">
                    <Input
                      readOnly
                      value="00020126580014br.gov.bcb.pix0136..."
                      className="h-9 text-xs font-mono bg-white border-emerald-200"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 shrink-0 border-emerald-200 hover:bg-emerald-100 text-emerald-800"
                      onClick={copyPixCode}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copiar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedCustomer && paymentMethod !== 'Venda a Prazo' && (
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
                <span>Subtotal Itens:</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              {calculatedDiscount > 0 && (
                <div className="flex justify-between text-sm text-destructive font-medium">
                  <span>Desconto Aplicado:</span>
                  <span>-{formatCurrency(calculatedDiscount)}</span>
                </div>
              )}
              {appliedCashback > 0 && paymentMethod !== 'Venda a Prazo' && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>Desconto Cashback:</span>
                  <span>-{formatCurrency(appliedCashback)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <span className="font-medium text-lg">A Pagar:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(
                    paymentMethod === 'Venda a Prazo' ? cartTotalWithDiscount : finalTotal,
                  )}
                </span>
              </div>
              {cashbackEarned > 0 &&
                selectedCustomerId !== 'none' &&
                paymentMethod !== 'Venda a Prazo' && (
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
              <div>Pagamento: {completedSale?.paymentMethod}</div>
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
              {completedSale?.discount ? (
                <div className="text-[10px] mb-1">
                  Desconto: -{formatCurrency(completedSale.discount)}
                </div>
              ) : null}
              {completedSale?.cashbackUsed && completedSale.paymentMethod !== 'Venda a Prazo' ? (
                <div className="text-[10px] mb-1">
                  Desconto Fid.: -{formatCurrency(completedSale.cashbackUsed)}
                </div>
              ) : null}
              <div className="font-bold text-sm mt-1">
                TOTAL R$: {formatCurrency(completedSale?.total || 0)}
              </div>
              {completedSale?.cashbackEarned && completedSale.paymentMethod !== 'Venda a Prazo' ? (
                <div className="text-[10px] mt-2 border-t border-dashed border-gray-400 pt-2">
                  Cashback Ganho: {formatCurrency(completedSale.cashbackEarned)}
                </div>
              ) : null}
            </div>

            {completedSale?.paymentMethod === 'Venda a Prazo' && (
              <div className="mt-6 pt-4 border-t border-dashed border-gray-400">
                <div className="text-center font-bold mb-2 text-sm">CONTRATO DE VENDA A PRAZO</div>
                <p className="text-justify text-[10px] mb-8 leading-tight">
                  Reconheço a exatidão desta nota de venda a prazo na importância de{' '}
                  {formatCurrency(completedSale.total)} que pagarei à CONSTRUMASTER, ou à sua ordem.
                </p>
                <div className="mt-10 border-t border-black w-4/5 mx-auto text-center pt-1">
                  Assinatura do Cliente
                </div>
                <div className="text-center text-[10px] mt-1 font-bold">
                  {completedSale.customer}
                </div>
                {completedSale.customerId && (
                  <div className="text-center text-[10px] mt-1">
                    Doc: {customers.find((c) => c.id === completedSale.customerId)?.document || ''}
                  </div>
                )}
              </div>
            )}
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
