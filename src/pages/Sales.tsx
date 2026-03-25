import { useState } from 'react'
import {
  useAppContext,
  Product,
  SaleItem,
  Sale,
  PaymentMethod,
  PreSale,
} from '@/context/AppContext'
import { formatCurrency, cn } from '@/lib/utils'
import {
  Search,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  ScanLine,
  Printer,
  Minus,
  Plus,
  QrCode,
  Copy,
  MessageCircle,
  FileText,
  Save,
  Play,
  RotateCcw,
  Gift,
  Camera,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CustomerCombobox } from '@/components/CustomerCombobox'
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal'

export default function Sales() {
  const {
    products,
    sales,
    customers,
    sellers,
    addSale,
    cashbackPercentage,
    preSales,
    addPreSale,
    updatePreSale,
    deletePreSale,
  } = useAppContext()

  const [activeTab, setActiveTab] = useState('pdv')

  const [searchTerm, setSearchTerm] = useState('')
  const [barcode, setBarcode] = useState('')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [cart, setCart] = useState<SaleItem[]>([])

  const [activePreSaleId, setActivePreSaleId] = useState<string | null>(null)
  const [isSavePreSaleOpen, setIsSavePreSaleOpen] = useState(false)
  const [preSaleCustomerName, setPreSaleCustomerName] = useState('')

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('none')
  const [selectedSellerId, setSelectedSellerId] = useState<string>('none')
  const [useCashback, setUseCashback] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Dinheiro')

  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState<string>('')

  const [receiptSale, setReceiptSale] = useState<Sale | null>(null)
  const [whatsappSale, setWhatsappSale] = useState<Sale | null>(null)
  const [whatsappPhone, setWhatsappPhone] = useState('')

  const filteredProducts = products.filter(
    (p) =>
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))) &&
      p.stock > 0,
  )

  const clearCart = () => {
    setCart([])
    setDiscountValue('')
    setActivePreSaleId(null)
    setPreSaleCustomerName('')
  }

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

  const processBarcode = (scannedBarcode: string) => {
    if (!scannedBarcode.trim()) return
    const product = products.find(
      (p) =>
        p.sku.toLowerCase() === scannedBarcode.toLowerCase() ||
        p.id === scannedBarcode ||
        p.barcode === scannedBarcode,
    )
    if (product) {
      if (product.stock <= 0) {
        toast({ variant: 'destructive', title: 'Produto sem estoque' })
        return
      }
      addToCart(product)
      toast({ title: 'Adicionado: ' + product.name })
    } else {
      toast({
        variant: 'destructive',
        title: 'Não encontrado',
        description: 'Verifique o código de barras.',
      })
    }
  }

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault()
    processBarcode(barcode)
    setBarcode('')
  }

  const handleCameraScan = (scannedBarcode: string) => {
    processBarcode(scannedBarcode)
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

  const handleSavePreSale = () => {
    if (!preSaleCustomerName.trim()) {
      toast({ variant: 'destructive', title: 'Informe o nome do cliente' })
      return
    }

    const payload = {
      customerName: preSaleCustomerName.trim(),
      items: cart.filter((i) => i.quantity > 0),
      total: cartTotalWithDiscount,
      discountType,
      discountValue,
    }

    if (activePreSaleId) {
      updatePreSale(activePreSaleId, payload)
      toast({ title: 'Pré-venda atualizada com sucesso!' })
    } else {
      addPreSale(payload)
      toast({ title: 'Pré-venda salva com sucesso!' })
    }

    clearCart()
    setIsSavePreSaleOpen(false)
  }

  const resumePreSale = (ps: PreSale) => {
    setCart(ps.items)
    setDiscountType(ps.discountType)
    setDiscountValue(ps.discountValue)
    setActivePreSaleId(ps.id)
    setPreSaleCustomerName(ps.customerName)
    setActiveTab('pdv')
    toast({
      title: `Pré-venda ${ps.id} carregada`,
      description: 'Edite os itens e finalize o pagamento.',
    })
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
    if (validItems.length === 0) return

    const selectedSeller = sellers.find((s) => s.id === selectedSellerId)

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
      sellerId: selectedSeller?.id,
      sellerName: selectedSeller?.name,
      sellerCode: selectedSeller?.code,
    })

    if (activePreSaleId) {
      deletePreSale(activePreSaleId)
    }

    setReceiptSale(sale)
    clearCart()
    setSelectedCustomerId('none')
    setSelectedSellerId('none')
    setUseCashback(false)
    setIsCheckoutOpen(false)

    if (cashbackEarned > 0 && selectedCustomerId !== 'none') {
      toast({
        title: 'Fidelidade Atualizada',
        description: `O cliente ganhou ${formatCurrency(cashbackEarned)} em pontos de fidelidade!`,
      })
    }
  }

  const printReceipt = () => {
    document.body.classList.add('printing-thermal')
    window.print()
    setTimeout(() => document.body.classList.remove('printing-thermal'), 500)
  }

  const copyReceiptText = () => {
    if (!receiptSale) return
    let text = `*CONSTRUMASTER*\nRecibo #${receiptSale.id}\nData: ${new Date(receiptSale.date).toLocaleString('pt-BR')}\nCliente: ${receiptSale.customer}\n\n*Itens:*\n`
    receiptSale.items.forEach((i) => {
      text += `- ${i.quantity}x ${i.product.name}: ${formatCurrency(i.total)}\n`
    })
    if (receiptSale.discount) text += `\nDesconto: -${formatCurrency(receiptSale.discount)}`
    text += `\n*Total a Pagar:* ${formatCurrency(receiptSale.total)}\nForma de Pagto: ${receiptSale.paymentMethod || 'Não informado'}\n`
    text += `\nObrigado pela preferência!`

    navigator.clipboard.writeText(text)
    toast({
      title: 'Recibo Copiado',
      description: 'O recibo foi copiado para a área de transferência.',
    })
  }

  const openWhatsappDialog = (sale: Sale) => {
    const phone = customers.find((c) => c.id === sale.customerId)?.phone || ''
    if (phone) {
      sendWhatsappMessage(sale, phone)
    } else {
      setWhatsappSale(sale)
      setWhatsappPhone('')
    }
  }

  const sendWhatsappMessage = (sale: Sale, phone: string) => {
    const summary = sale.items
      .slice(0, 3)
      .map((i) => `${i.quantity}x ${i.product.name}`)
      .join(', ')
    const extendedSummary =
      sale.items.length > 3 ? `${summary} e mais ${sale.items.length - 3} itens` : summary
    const text = `Olá${sale.customer !== 'Consumidor Final' ? ` ${sale.customer}` : ''}, aqui é da ConstruMaster. Segue o resumo da sua compra: ${extendedSummary}. Total: ${formatCurrency(sale.total)}. Obrigado pela preferência!`
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank')
    setWhatsappSale(null)
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground">Ponto de venda e histórico de transações.</p>
        </div>
        <TabsList>
          <TabsTrigger value="pdv">Caixa / PDV</TabsTrigger>
          <TabsTrigger value="prevendas">
            Pré-vendas
            {preSales.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary/20 hover:bg-primary/20">
                {preSales.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="pdv" className="flex flex-col lg:flex-row gap-6 flex-1 mt-0 print:hidden">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form onSubmit={handleBarcodeScan} className="relative flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-3 h-5 w-5 text-primary" />
                <Input
                  placeholder="Escanear (USB)..."
                  className="pl-10 h-12 shadow-sm border-primary/50 focus-visible:ring-primary"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  autoFocus
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-12 shrink-0 border-primary/50 text-primary hover:bg-primary/10"
                onClick={() => setIsScannerOpen(true)}
                title="Escanear com Câmera"
              >
                <Camera className="h-5 w-5" />
              </Button>
              <button type="submit" className="hidden" />
            </form>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, SKU ou EAN..."
                className="pl-10 h-12 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 bg-card border rounded-lg shadow-sm h-[calc(100vh-16rem)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border p-3 rounded-lg hover:border-primary cursor-pointer transition-colors flex flex-col justify-between"
                  onClick={() => addToCart(product)}
                >
                  <div>
                    <p className="font-semibold text-sm leading-tight mb-1">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground mb-1">
                      Cód: {product.barcode || product.sku}
                    </p>
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
          <CardHeader className="bg-muted/30 pb-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Carrinho
              {activePreSaleId && (
                <Badge variant="secondary" className="ml-1 text-[10px] uppercase">
                  Editando {activePreSaleId}
                </Badge>
              )}
            </CardTitle>
            {(cart.length > 0 || activePreSaleId) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                onClick={clearCart}
              >
                <RotateCcw className="h-3 w-3 mr-1" /> Limpar
              </Button>
            )}
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
          <CardFooter className="flex-col gap-3 border-t p-4 bg-muted/10">
            <div className="w-full flex justify-between items-center text-lg mb-1">
              <span className="font-semibold text-muted-foreground">Total Geral</span>
              <span className="font-bold text-2xl text-primary">
                {formatCurrency(cartTotalWithDiscount)}
              </span>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1 h-12 bg-background shadow-sm hover:bg-muted font-medium"
                disabled={!hasValidItems}
                onClick={() => setIsSavePreSaleOpen(true)}
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar Pré-venda
              </Button>
              <Button
                className="flex-1 h-12 font-bold"
                disabled={!hasValidItems}
                onClick={() => setIsCheckoutOpen(true)}
              >
                Pagamento
              </Button>
            </div>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="prevendas" className="flex-1 mt-0">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Pré-vendas Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Data / ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Itens</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preSales.map((ps) => (
                  <TableRow key={ps.id}>
                    <TableCell className="pl-6">
                      <div className="font-medium">
                        {new Date(ps.date).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">{ps.id}</div>
                    </TableCell>
                    <TableCell className="font-medium">{ps.customerName}</TableCell>
                    <TableCell className="text-center">
                      {ps.items.reduce((acc, i) => acc + i.quantity, 0)} unid.
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(ps.total)}
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      <Button variant="outline" size="sm" onClick={() => resumePreSale(ps)}>
                        <Play className="h-4 w-4 mr-1" /> Retomar no PDV
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => deletePreSale(ps.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {preSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <Save className="h-8 w-8 mx-auto mb-3 opacity-20" />
                      Nenhuma pré-venda salva no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="historico" className="flex-1 mt-0">
        <Card className="h-full flex flex-col">
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Data / Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="pl-6">
                      <div className="font-medium">
                        {new Date(sale.date).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">{sale.id}</div>
                    </TableCell>
                    <TableCell>
                      {sale.customer || 'Consumidor Final'}
                      {sale.sellerName && (
                        <div className="text-xs text-muted-foreground">
                          Vend: {sale.sellerCode ? `${sale.sellerCode} - ` : ''}
                          {sale.sellerName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{sale.paymentMethod || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={sale.status === 'Pago' ? 'default' : 'secondary'}
                        className={sale.status === 'Pago' ? 'bg-emerald-500' : ''}
                      >
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => openWhatsappDialog(sale)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setReceiptSale(sale)}>
                        <FileText className="h-4 w-4 mr-1" /> Gerar Recibo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {sales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma venda registrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Save Pre-sale Dialog */}
      <Dialog open={isSavePreSaleOpen} onOpenChange={setIsSavePreSaleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {activePreSaleId ? 'Atualizar Pré-venda' : 'Salvar Pré-venda'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">
                Nome do Cliente / Identificação do Pedido{' '}
                <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-col gap-2">
                <CustomerCombobox
                  customers={customers}
                  value="none"
                  onChange={(val) => {
                    if (val !== 'none') {
                      const c = customers.find((x) => x.id === val)
                      if (c) setPreSaleCustomerName(c.name)
                    }
                  }}
                  placeholder="Preencher com cliente existente..."
                />
                <Input
                  id="customerName"
                  placeholder="Ou digite o nome avulso / identificação"
                  value={preSaleCustomerName}
                  onChange={(e) => setPreSaleCustomerName(e.target.value)}
                  autoFocus
                  className={cn(
                    !preSaleCustomerName.trim() &&
                      'border-destructive focus-visible:ring-destructive',
                  )}
                />
              </div>
              {!preSaleCustomerName.trim() && (
                <p className="text-[10px] text-destructive">
                  O nome do cliente é obrigatório para salvar a pré-venda.
                </p>
              )}
            </div>
            <div className="bg-muted/50 p-3 rounded-md border text-sm flex justify-between items-center">
              <span className="text-muted-foreground">Total do pedido:</span>
              <span className="font-bold text-primary">
                {formatCurrency(cartTotalWithDiscount)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSavePreSaleOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePreSale} disabled={!preSaleCustomerName.trim()}>
              <Save className="mr-2 h-4 w-4" /> {activePreSaleId ? 'Atualizar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Cliente (Fidelidade / Prazo)</Label>
              <CustomerCombobox
                customers={customers}
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
                allowWalkIn
              />
            </div>

            <div className="space-y-2">
              <Label>Vendedor Responsável</Label>
              <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum / Não Informado</SelectItem>
                  {sellers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} - {s.name}
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
                      onClick={() => {
                        navigator.clipboard.writeText(
                          '00020126580014br.gov.bcb.pix0136-mock-code-1234',
                        )
                        toast({ title: 'Código PIX copiado!' })
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copiar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Loyalty Program integration */}
            {selectedCustomer && paymentMethod !== 'Venda a Prazo' && (
              <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-indigo-900 flex items-center gap-1.5">
                    <Gift className="h-4 w-4" /> Saldo Fidelidade
                  </p>
                  <p className="text-xs text-indigo-700 font-bold mt-1">
                    Disponível: {formatCurrency(availableCashback)}
                  </p>
                </div>
                {availableCashback > 0 && (
                  <div className="flex items-center space-x-2 bg-white p-2 rounded border border-indigo-50">
                    <Checkbox
                      id="useCashback"
                      checked={useCashback}
                      onCheckedChange={(v) => setUseCashback(v === true)}
                    />
                    <Label
                      htmlFor="useCashback"
                      className="text-sm cursor-pointer text-indigo-900 font-medium"
                    >
                      Usar saldo
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
                <div className="flex justify-between text-sm text-indigo-600 font-medium">
                  <span>Desconto Fidelidade:</span>
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
                  <div className="text-right text-xs text-indigo-600 mt-1 font-medium flex justify-end items-center gap-1">
                    <Gift className="h-3 w-3" /> + {formatCurrency(cashbackEarned)} para o saldo
                    fidelidade
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
      <Dialog open={!!receiptSale} onOpenChange={(open) => !open && setReceiptSale(null)}>
        <DialogContent className="sm:max-w-[400px] thermal-dialog-content">
          <DialogHeader className="print:hidden hide-in-thermal">
            <DialogTitle>Recibo de Venda</DialogTitle>
          </DialogHeader>
          <div className="thermal-receipt bg-white text-black p-4 text-xs font-mono border rounded-md">
            <div className="text-center font-bold text-base mb-1">CONSTRUMASTER</div>
            <div className="text-center mb-3 text-[10px]">CNPJ: 12.345.678/0001-90</div>
            <div className="border-b border-dashed border-gray-400 mb-2 pb-2 text-[10px]">
              <div>
                Data: {receiptSale ? new Date(receiptSale.date).toLocaleString('pt-BR') : ''}
              </div>
              <div>Cliente: {receiptSale?.customer}</div>
              <div>ID: {receiptSale?.id}</div>
              <div>Pagamento: {receiptSale?.paymentMethod}</div>
              <div>
                Vendedor: {receiptSale?.sellerCode ? `${receiptSale.sellerCode} - ` : ''}
                {receiptSale?.sellerName || '-'}
              </div>
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
                {receiptSale?.items.map((item, i) => (
                  <tr key={i}>
                    <td className="truncate max-w-[120px] py-1">{item.product.name}</td>
                    <td className="text-right py-1">{item.quantity}</td>
                    <td className="text-right py-1">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-dashed border-gray-400 pt-2 text-right">
              {receiptSale?.discount ? (
                <div className="text-[10px] mb-1">
                  Desconto: -{formatCurrency(receiptSale.discount)}
                </div>
              ) : null}
              {receiptSale?.cashbackUsed && receiptSale.paymentMethod !== 'Venda a Prazo' ? (
                <div className="text-[10px] mb-1">
                  Desconto Fidelidade: -{formatCurrency(receiptSale.cashbackUsed)}
                </div>
              ) : null}
              <div className="font-bold text-sm mt-1">
                TOTAL R$: {formatCurrency(receiptSale?.total || 0)}
              </div>
              {receiptSale?.cashbackEarned && receiptSale.paymentMethod !== 'Venda a Prazo' ? (
                <div className="text-[10px] mt-2 border-t border-dashed border-gray-400 pt-2">
                  Saldo Fidelidade Ganho: {formatCurrency(receiptSale.cashbackEarned)}
                </div>
              ) : null}
            </div>

            {receiptSale?.paymentMethod === 'Venda a Prazo' && (
              <div className="mt-6 pt-4 border-t border-dashed border-gray-400">
                <div className="text-center font-bold mb-2 text-sm">CONTRATO DE VENDA A PRAZO</div>
                <p className="text-justify text-[10px] mb-8 leading-tight">
                  Reconheço a exatidão desta nota de venda a prazo na importância de{' '}
                  {formatCurrency(receiptSale.total)} que pagarei à CONSTRUMASTER, ou à sua ordem.
                </p>
                <div className="mt-10 border-t border-black w-4/5 mx-auto text-center pt-1">
                  Assinatura do Cliente
                </div>
                <div className="text-center text-[10px] mt-1 font-bold">{receiptSale.customer}</div>
                {receiptSale.customerId && (
                  <div className="text-center text-[10px] mt-1">
                    Doc: {customers.find((c) => c.id === receiptSale.customerId)?.document || ''}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="print:hidden hide-in-thermal">
            <Button variant="outline" onClick={() => setReceiptSale(null)}>
              Fechar
            </Button>
            <Button
              variant="outline"
              className="text-blue-600 hover:text-blue-700"
              onClick={copyReceiptText}
            >
              <Copy className="mr-2 h-4 w-4" /> Copiar (WhatsApp)
            </Button>
            <Button onClick={printReceipt}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Prompt Dialog */}
      <Dialog open={!!whatsappSale} onOpenChange={(o) => !o && setWhatsappSale(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Enviar Recibo via WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Telefone do Cliente</Label>
            <Input
              placeholder="(11) 99999-9999"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Este cliente não possui telefone cadastrado. Informe um número para enviar o recibo.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsappSale(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => whatsappSale && sendWhatsappMessage(whatsappSale, whatsappPhone)}
              disabled={!whatsappPhone}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Enviar Mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScannerModal
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleCameraScan}
      />
    </Tabs>
  )
}
