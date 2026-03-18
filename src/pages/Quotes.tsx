import { useState } from 'react'
import { useAppContext, SaleItem, PaymentMethod, Quote } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import {
  FileText,
  Plus,
  CheckCircle2,
  ShoppingCart,
  Trash2,
  Printer,
  MessageCircle,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Quotes() {
  const { quotes, customers, products, addQuote, convertQuoteToSale } = useAppContext()
  const [isCreating, setIsCreating] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Dinheiro')

  const [cart, setCart] = useState<SaleItem[]>([])
  const [customerId, setCustomerId] = useState('none')
  const [discount, setDiscount] = useState('')

  const [receiptQuote, setReceiptQuote] = useState<Quote | null>(null)
  const [whatsappQuote, setWhatsappQuote] = useState<Quote | null>(null)
  const [whatsappPhone, setWhatsappPhone] = useState('')

  const addToCart = (productId: string) => {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    if (!cart.find((c) => c.product.id === p.id)) {
      setCart([...cart, { product: p, quantity: 1, total: p.price }])
    }
  }

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return
    setCart(
      cart.map((c) =>
        c.product.id === id ? { ...c, quantity: qty, total: qty * c.product.price } : c,
      ),
    )
  }

  const cartTotal = cart.reduce((acc, c) => acc + c.total, 0)
  const discountVal = Number(discount) || 0
  const finalTotal = Math.max(0, cartTotal - discountVal)

  const handleSaveQuote = () => {
    if (cart.length === 0) return
    addQuote({
      customerId: customerId !== 'none' ? customerId : undefined,
      customer:
        customerId !== 'none'
          ? customers.find((c) => c.id === customerId)?.name
          : 'Consumidor Final',
      items: cart,
      total: finalTotal,
      discount: discountVal > 0 ? discountVal : undefined,
    })
    setIsCreating(false)
    setCart([])
    setCustomerId('none')
    setDiscount('')

    // Auto-open receipt for the newly created quote
    const newQuoteObj = {
      id: `ORC-${1000 + quotes.length + 1}`,
      date: new Date().toISOString(),
      status: 'Pendente' as const,
      customerId: customerId !== 'none' ? customerId : undefined,
      customer:
        customerId !== 'none'
          ? customers.find((c) => c.id === customerId)?.name
          : 'Consumidor Final',
      items: cart,
      total: finalTotal,
      discount: discountVal > 0 ? discountVal : undefined,
    }
    setReceiptQuote(newQuoteObj)
  }

  const handleConvert = () => {
    if (selectedQuoteId) {
      convertQuoteToSale(selectedQuoteId, paymentMethod)
      setSelectedQuoteId(null)
    }
  }

  const printReceipt = () => {
    document.body.classList.add('printing-thermal')
    window.print()
    setTimeout(() => document.body.classList.remove('printing-thermal'), 500)
  }

  const openWhatsappDialog = (quote: Quote) => {
    const phone = customers.find((c) => c.id === quote.customerId)?.phone || ''
    if (phone) {
      sendWhatsappMessage(quote, phone)
    } else {
      setWhatsappQuote(quote)
      setWhatsappPhone('')
    }
  }

  const sendWhatsappMessage = (quote: Quote, phone: string) => {
    const summary = quote.items
      .slice(0, 3)
      .map((i) => `${i.quantity}x ${i.product.name}`)
      .join(', ')
    const extendedSummary =
      quote.items.length > 3 ? `${summary} e mais ${quote.items.length - 3} itens` : summary
    const text = `Olá${quote.customer && quote.customer !== 'Consumidor Final' ? ` ${quote.customer}` : ''}, aqui é da ConstruMaster. Segue o resumo do seu orçamento: ${extendedSummary}. Total estimado: ${formatCurrency(quote.total)}. Qualquer dúvida, estamos à disposição!`
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank')
    setWhatsappQuote(null)
  }

  if (isCreating) {
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Novo Orçamento</h1>
          <Button variant="outline" onClick={() => setIsCreating(false)}>
            Voltar
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-[calc(100vh-10rem)]">
          <div className="lg:col-span-2 flex flex-col gap-4 bg-card border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Consumidor Final</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Adicionar Produto</Label>
                <Select onValueChange={addToCart} value="">
                  <SelectTrigger>
                    <SelectValue placeholder="Buscar produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ScrollArea className="flex-1 border rounded-md p-2">
              {cart.map((c) => (
                <div
                  key={c.product.id}
                  className="flex justify-between items-center border-b pb-2 mb-2 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{c.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(c.product.price)} un
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={c.quantity}
                      onChange={(e) => updateQty(c.product.id, Number(e.target.value))}
                      className="w-16 h-8 text-center"
                    />
                    <span className="font-bold w-20 text-right">{formatCurrency(c.total)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-8 w-8"
                      onClick={() => setCart(cart.filter((x) => x.product.id !== c.product.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
          <div className="bg-card border rounded-lg p-4 flex flex-col shadow-sm">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Resumo
            </h2>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Desconto (R$)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
            </div>
            <div className="pt-4 border-t mt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Total Geral</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
              <Button
                className="w-full h-12 text-lg"
                disabled={cart.length === 0}
                onClick={handleSaveQuote}
              >
                Salvar Orçamento
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground">Crie e converta orçamentos em vendas facilmente.</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Orçamento
        </Button>
      </div>

      <div className="bg-card border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Número / Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Valor Estimado</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="pl-6 font-medium">
                  <div>{q.id}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {new Date(q.date).toLocaleDateString('pt-BR')}
                  </div>
                </TableCell>
                <TableCell>{q.customer}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(q.total)}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={q.status === 'Pendente' ? 'secondary' : 'default'}
                    className={q.status === 'Convertido' ? 'bg-emerald-500' : ''}
                  >
                    {q.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6 space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    onClick={() => openWhatsappDialog(q)}
                    title="Enviar via WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setReceiptQuote(q)}
                    title="Ver Recibo"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {q.status === 'Pendente' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedQuoteId(q.id)}
                      className="hover:bg-primary/10"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Converter
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {quotes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum orçamento registrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedQuoteId} onOpenChange={(open) => !open && setSelectedQuoteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter Orçamento em Venda</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Ao converter, os itens serão deduzidos do estoque e a venda será registrada no
              financeiro.
            </p>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Venda a Prazo">Venda a Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedQuoteId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConvert} className="bg-emerald-600 hover:bg-emerald-700">
              Confirmar Conversão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog (Thermal Print) */}
      <Dialog open={!!receiptQuote} onOpenChange={(open) => !open && setReceiptQuote(null)}>
        <DialogContent className="sm:max-w-[400px] thermal-dialog-content">
          <DialogHeader className="print:hidden hide-in-thermal">
            <DialogTitle>Impressão de Orçamento</DialogTitle>
          </DialogHeader>
          <div className="thermal-receipt bg-white text-black p-4 text-xs font-mono border rounded-md">
            <div className="text-center font-bold text-base mb-1">CONSTRUMASTER</div>
            <div className="text-center mb-2 font-bold bg-black text-white py-1">ORÇAMENTO</div>
            <div className="border-b border-dashed border-gray-400 mb-2 pb-2 text-[10px]">
              <div>
                Data: {receiptQuote ? new Date(receiptQuote.date).toLocaleString('pt-BR') : ''}
              </div>
              <div>Cliente: {receiptQuote?.customer}</div>
              <div>ID: {receiptQuote?.id}</div>
              <div>Validade: 15 dias</div>
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
                {receiptQuote?.items.map((item, i) => (
                  <tr key={i}>
                    <td className="truncate max-w-[120px] py-1">{item.product.name}</td>
                    <td className="text-right py-1">{item.quantity}</td>
                    <td className="text-right py-1">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-dashed border-gray-400 pt-2 text-right">
              {receiptQuote?.discount ? (
                <div className="text-[10px] mb-1">
                  Desconto: -{formatCurrency(receiptQuote.discount)}
                </div>
              ) : null}
              <div className="font-bold text-sm mt-1">
                TOTAL ESTIMADO: {formatCurrency(receiptQuote?.total || 0)}
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-dashed border-gray-400 text-center text-[10px]">
              Este documento não é válido como nota fiscal.
            </div>
          </div>
          <DialogFooter className="print:hidden hide-in-thermal">
            <Button variant="outline" onClick={() => setReceiptQuote(null)}>
              Fechar
            </Button>
            <Button
              variant="outline"
              className="text-emerald-600 hover:text-emerald-700"
              onClick={() => receiptQuote && openWhatsappDialog(receiptQuote)}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
            <Button onClick={printReceipt}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir (Térmica)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Prompt Dialog */}
      <Dialog open={!!whatsappQuote} onOpenChange={(o) => !o && setWhatsappQuote(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Enviar Orçamento via WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Telefone do Cliente</Label>
            <Input
              placeholder="(11) 99999-9999"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Este cliente não possui telefone cadastrado. Informe um número para enviar.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsappQuote(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => whatsappQuote && sendWhatsappMessage(whatsappQuote, whatsappPhone)}
              disabled={!whatsappPhone}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Enviar Mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
