import { useState, useMemo } from 'react'
import {
  Search,
  Trash2,
  ShoppingCart,
  Wallet,
  CheckCircle2,
  PackageSearch,
  AlertCircle,
} from 'lucide-react'
import { useAppContext, Product, SaleItem } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type CartItem = SaleItem & { unitPrice: number; basePrice: number }

export default function Sales() {
  const {
    sales,
    products,
    addSale,
    customers,
    sellers,
    currentUser,
    sellerCreditHistory,
    adjustSellerBalance,
  } = useAppContext()

  const [view, setView] = useState<'list' | 'new'>('list')
  const [searchTerm, setSearchTerm] = useState('')

  // New Sale State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('final')
  const [selectedSellerId, setSelectedSellerId] = useState<string>(
    currentUser.role === 'Seller' ? sellers.find((s) => s.name === currentUser.name)?.id || '' : '',
  )
  const [cart, setCart] = useState<CartItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX')

  const currentSeller = useMemo(
    () => sellers.find((s) => s.id === selectedSellerId),
    [sellers, selectedSellerId],
  )
  const currentBalance = currentSeller?.currentBalance || 0

  const filteredSales = sales.filter(
    (s) =>
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer?.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()),
  )

  const handleAddProduct = (product: Product) => {
    if (product.stock <= 0) {
      toast({ title: 'Sem estoque', description: 'Produto indisponível.', variant: 'destructive' })
      return
    }
    const existing = cart.find((item) => item.product.id === product.id)
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast({ title: 'Estoque insuficiente', variant: 'destructive' })
        return
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item,
        ),
      )
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unitPrice: product.price,
          basePrice: product.price,
          total: product.price,
        },
      ])
    }
    setProductSearch('')
  }

  const handleUpdateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((item) => item.product.id !== productId))
      return
    }
    const product = products.find((p) => p.id === productId)
    if (product && qty > product.stock) {
      toast({ title: 'Estoque insuficiente', variant: 'destructive' })
      return
    }
    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: qty, total: qty * item.unitPrice }
          : item,
      ),
    )
  }

  const handleUpdatePrice = (productId: string, newPrice: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? { ...item, unitPrice: newPrice, total: item.quantity * newPrice }
          : item,
      ),
    )
  }

  const totals = useMemo(() => {
    let totalBase = 0
    let totalFinal = 0
    cart.forEach((item) => {
      totalBase += item.basePrice * item.quantity
      totalFinal += item.unitPrice * item.quantity
    })
    const diff = totalFinal - totalBase // Positive = Credit generated, Negative = Debit used
    return { totalBase, totalFinal, diff }
  }, [cart])

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [saleResult, setSaleResult] = useState<{
    diff: number
    type: string
    amount: number
    newBalance: number
  } | null>(null)
  const [isExtractOpen, setIsExtractOpen] = useState(false)

  const currentSellerMaxDiscount = currentSeller?.maxDiscountLimit || 1000
  const isExceedingDebit = totals.diff < 0 && Math.abs(totals.diff) > currentBalance
  const isExceedingLimit = totals.diff < 0 && Math.abs(totals.diff) > currentSellerMaxDiscount

  const handleFinishSale = () => {
    if (cart.length === 0) return
    if (!currentSeller) {
      toast({ title: 'Selecione um vendedor', variant: 'destructive' })
      return
    }
    if (isExceedingDebit) {
      toast({
        title: 'Saldo insuficiente',
        description: `Créditos disponíveis: ${formatCurrency(currentBalance)}`,
        variant: 'destructive',
      })
      return
    }
    if (isExceedingLimit) {
      toast({
        title: 'Limite excedido',
        description: 'Operação excede o limite permitido para seu perfil.',
        variant: 'destructive',
      })
      return
    }

    const customer = customers.find((c) => c.id === selectedCustomerId)

    const sale = addSale({
      customerId: customer?.id,
      customer: customer?.name || 'Consumidor Final',
      items: cart.map((c) => ({ product: c.product, quantity: c.quantity, total: c.total })),
      total: totals.totalFinal,
      paymentMethod: paymentMethod as any,
      sellerId: currentSeller.id,
      sellerName: currentSeller.name,
      sellerCode: currentSeller.code,
    })

    if (totals.diff !== 0) {
      adjustSellerBalance(
        currentSeller.id,
        totals.diff,
        totals.diff > 0 ? 'credito' : 'debito',
        `Ajuste Pedido ${sale.id}`,
        sale.id,
      )
      setSaleResult({
        diff: totals.diff,
        type: totals.diff > 0 ? 'Crédito' : 'Débito',
        amount: Math.abs(totals.diff),
        newBalance: currentBalance + totals.diff,
      })
      setIsConfirmOpen(true)
    } else {
      toast({ title: 'Venda Concluída', description: `Pedido ${sale.id} registrado com sucesso.` })
      resetNewSale()
    }
  }

  const resetNewSale = () => {
    setCart([])
    setView('list')
    setSaleResult(null)
    setIsConfirmOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendas (PDV)</h1>
          <p className="text-muted-foreground">Realize novas vendas e consulte o histórico.</p>
        </div>
        {view === 'list' ? (
          <Button onClick={() => setView('new')} size="lg" className="bg-primary">
            <ShoppingCart className="mr-2 h-5 w-5" /> Nova Venda
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setView('list')}>
            Voltar para Lista
          </Button>
        )}
      </div>

      {view === 'list' && (
        <div className="bg-card border rounded-lg shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou ID..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.id}</TableCell>
                  <TableCell>{new Date(s.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{s.customer}</TableCell>
                  <TableCell>{s.sellerName || '-'}</TableCell>
                  <TableCell>{s.paymentMethod || '-'}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(s.total)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        s.status === 'Pago'
                          ? 'default'
                          : s.status === 'Cancelado'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className={s.status === 'Pago' ? 'bg-emerald-500' : ''}
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma venda encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {view === 'new' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PackageSearch className="h-5 w-5" /> Buscar Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite o nome ou código do produto..."
                    className="pl-9"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                {productSearch && (
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    <div className="space-y-2">
                      {filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg border border-transparent hover:border-border transition-colors cursor-pointer"
                          onClick={() => handleAddProduct(p)}
                        >
                          <div>
                            <p className="font-medium leading-tight">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Ref: {p.sku} | Estoque: {p.stock}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{formatCurrency(p.price)}</p>
                          </div>
                        </div>
                      ))}
                      {filteredProducts.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          Nenhum produto encontrado.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" /> Itens da Venda
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-[100px]">Qtd</TableHead>
                      <TableHead className="w-[160px]">Preço Unit. (R$)</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.product.id}>
                        <TableCell>
                          <p className="font-medium line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Base: {formatCurrency(item.basePrice)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            max={item.product.stock}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(item.product.id, parseInt(e.target.value) || 1)
                            }
                            className="w-16 text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleUpdatePrice(item.product.id, parseFloat(e.target.value) || 0)
                            }
                            className={cn('w-28 text-right font-medium transition-colors', {
                              'border-emerald-500 text-emerald-700 bg-emerald-50 ring-emerald-200 focus-visible:ring-emerald-500':
                                item.unitPrice > item.basePrice,
                              'border-amber-400 text-amber-700 bg-amber-50 ring-amber-200 focus-visible:ring-amber-500':
                                item.unitPrice === item.basePrice,
                              'border-red-500 text-red-700 bg-red-50 ring-red-200 focus-visible:ring-red-500':
                                item.unitPrice < item.basePrice && isExceedingDebit,
                              'border-blue-500 text-blue-700 bg-blue-50 ring-blue-200 focus-visible:ring-blue-500':
                                item.unitPrice < item.basePrice && !isExceedingDebit,
                            })}
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(item.total)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleUpdateQuantity(item.product.id, 0)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {cart.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          Adicione produtos para iniciar a venda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/20 shadow-md sticky top-6">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Resumo da Venda</span>
                  <Wallet className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Vendedor</Label>
                  <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentSeller && (
                    <>
                      <div className="flex items-center justify-between mt-2 p-3 bg-muted/50 rounded-lg border">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            Saldo de Créditos
                          </span>
                          <span
                            className={cn(
                              'text-lg font-bold',
                              currentBalance > 0 ? 'text-emerald-600' : 'text-primary',
                            )}
                          >
                            {formatCurrency(currentBalance)}
                          </span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setIsExtractOpen(true)}>
                          Ver Extrato
                        </Button>
                      </div>
                      {currentBalance < 50 && (
                        <Alert className="bg-amber-50 border-amber-200 mt-2 text-amber-800">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertTitle className="text-amber-800">Atenção: Saldo Baixo</AlertTitle>
                          <AlertDescription className="text-amber-700/90 text-xs">
                            Seu saldo de créditos está baixo ({formatCurrency(currentBalance)}).
                            Procure realizar vendas acima do preço base para recuperar sua margem.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="final">Consumidor Final</SelectItem>
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
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                      <SelectItem value="Venda a Prazo">Venda a Prazo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal (Tabela)</span>
                    <span>{formatCurrency(totals.totalBase)}</span>
                  </div>
                  {totals.diff !== 0 && (
                    <div
                      className={cn(
                        'flex justify-between text-sm font-medium',
                        totals.diff > 0 ? 'text-emerald-600' : 'text-blue-600',
                      )}
                    >
                      <span>
                        {totals.diff > 0 ? 'Acréscimo (Crédito Gerado)' : 'Desconto (Débito Usado)'}
                      </span>
                      <span>
                        {totals.diff > 0 ? '+' : ''}
                        {formatCurrency(totals.diff)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-end pt-2">
                    <span className="text-lg font-bold">Total a Pagar</span>
                    <span className="text-3xl font-black text-primary leading-none">
                      {formatCurrency(totals.totalFinal)}
                    </span>
                  </div>
                </div>

                {isExceedingDebit && (
                  <div className="flex items-start gap-2 text-red-700 bg-red-50 p-3 rounded-md border border-red-200 mt-4 animate-in fade-in zoom-in duration-300">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">
                      Saldo insuficiente. Créditos disponíveis: {formatCurrency(currentBalance)}
                    </span>
                  </div>
                )}
                {isExceedingLimit && (
                  <div className="flex items-start gap-2 text-red-700 bg-red-50 p-3 rounded-md border border-red-200 mt-4 animate-in fade-in zoom-in duration-300">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">
                      Operação excede o limite permitido para seu perfil. O limite de desconto é de{' '}
                      {formatCurrency(currentSellerMaxDiscount)}.
                    </span>
                  </div>
                )}

                <Button
                  className="w-full h-14 text-lg mt-4"
                  size="lg"
                  onClick={handleFinishSale}
                  disabled={
                    cart.length === 0 || isExceedingDebit || isExceedingLimit || !currentSeller
                  }
                >
                  <CheckCircle2 className="mr-2 h-6 w-6" />
                  Finalizar Venda
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Venda Concluída com Ajustes</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <p className="text-lg text-muted-foreground">
              Preço ajustado em{' '}
              <strong className="text-foreground">
                {formatCurrency(Math.abs(saleResult?.diff || 0))}
              </strong>
              .
            </p>
            <p className="text-lg text-muted-foreground">
              {saleResult?.type}:{' '}
              <strong
                className={saleResult?.type === 'Crédito' ? 'text-emerald-600' : 'text-blue-600'}
              >
                {formatCurrency(saleResult?.amount || 0)}
              </strong>
              .
            </p>
            <div className="bg-muted p-4 rounded-lg w-full mt-4 border border-border">
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                Novo Saldo do Vendedor
              </p>
              <p className="text-2xl font-black text-primary">
                {formatCurrency(saleResult?.newBalance || 0)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={resetNewSale} className="w-full h-12">
              Fechar e Nova Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statement Modal */}
      <Dialog open={isExtractOpen} onOpenChange={setIsExtractOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Extrato de Créditos - {currentSeller?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] mt-2 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Pedido / Ref</TableHead>
                  <TableHead>Motivo / Operador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Saldo Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSeller &&
                  sellerCreditHistory
                    .filter((h) => h.sellerId === currentSeller.id)
                    .sort(
                      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                    )
                    .map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(h.createdAt).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>{h.saleId || '-'}</TableCell>
                        <TableCell>
                          <span className="block truncate max-w-[200px]" title={h.reason}>
                            {h.reason || '-'}
                          </span>
                          <span className="text-xs text-muted-foreground">Por: {h.createdBy}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={h.value > 0 ? 'default' : 'destructive'}
                            className={h.value > 0 ? 'bg-emerald-500' : ''}
                          >
                            {h.type === 'credito'
                              ? 'Crédito Venda'
                              : h.type === 'debito'
                                ? 'Débito Venda'
                                : h.type === 'manual_add'
                                  ? 'Adição Manual'
                                  : h.type === 'manual_edit'
                                    ? 'Ajuste Manual'
                                    : 'Reset'}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-medium',
                            h.value > 0 ? 'text-emerald-600' : 'text-red-600',
                          )}
                        >
                          {h.value > 0 ? '+' : ''}
                          {formatCurrency(h.value)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(h.newBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                {(!currentSeller ||
                  sellerCreditHistory.filter((h) => h.sellerId === currentSeller.id).length ===
                    0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
