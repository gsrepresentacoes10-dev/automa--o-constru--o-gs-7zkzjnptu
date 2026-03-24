import { useState } from 'react'
import { useAppContext, SaleItem, PaymentMethod, Quote } from '@/context/AppContext'
import { formatCurrency, cn } from '@/lib/utils'
import {
  FileText,
  Plus,
  CheckCircle2,
  ShoppingCart,
  Trash2,
  MessageCircle,
  AlertCircle,
  Clock,
  Download,
  Mail,
  Pencil,
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
import { CustomerCombobox } from '@/components/CustomerCombobox'

export default function Quotes() {
  const {
    quotes,
    customers,
    products,
    addQuote,
    updateQuote,
    convertQuoteToSale,
    convertQuoteToPreSale,
  } = useAppContext()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null)

  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Dinheiro')

  const [cart, setCart] = useState<SaleItem[]>([])
  const [customerId, setCustomerId] = useState('none')
  const [customerName, setCustomerName] = useState('')
  const [discount, setDiscount] = useState('')
  const [validUntil, setValidUntil] = useState('')

  const [a4Quote, setA4Quote] = useState<Quote | null>(null)
  const [whatsappQuote, setWhatsappQuote] = useState<Quote | null>(null)
  const [whatsappPhone, setWhatsappPhone] = useState('')

  const handleNewQuote = () => {
    setEditingQuoteId(null)
    setCart([])
    setCustomerId('none')
    setCustomerName('')
    setDiscount('')
    setValidUntil('')
    setIsFormOpen(true)
  }

  const handleEditQuote = (quote: Quote) => {
    setEditingQuoteId(quote.id)
    setCart(quote.items)
    setCustomerId(quote.customerId || 'none')
    setCustomerName(quote.customer || '')
    setDiscount(quote.discount ? String(quote.discount) : '')
    setValidUntil(quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : '')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingQuoteId(null)
  }

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
    if (cart.length === 0 || !customerName.trim() || !validUntil) return

    const quoteData = {
      customerId: customerId !== 'none' ? customerId : undefined,
      customer: customerName.trim(),
      items: cart,
      total: finalTotal,
      discount: discountVal > 0 ? discountVal : undefined,
      validUntil: new Date(validUntil).toISOString(),
    }

    if (editingQuoteId) {
      updateQuote(editingQuoteId, quoteData)
    } else {
      addQuote(quoteData)
      const newQuoteObj = {
        id: `ORC-${1000 + quotes.length + 1}`,
        date: new Date().toISOString(),
        status: 'Pendente' as const,
        ...quoteData,
      }
      setA4Quote(newQuoteObj)
    }

    closeForm()
  }

  const handleConvert = () => {
    if (selectedQuoteId) {
      convertQuoteToSale(selectedQuoteId, paymentMethod)
      setSelectedQuoteId(null)
    }
  }

  const printA4PDF = () => {
    document.body.classList.add('printing-a4')
    window.print()
    setTimeout(() => document.body.classList.remove('printing-a4'), 500)
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
    const text = `Olá${quote.customer && quote.customer !== 'Consumidor Final' ? ` ${quote.customer}` : ''}, aqui é da ConstruMaster.\n\nSegue o resumo do seu orçamento *#${quote.id}*.\n*Valor Total Estimado:* ${formatCurrency(quote.total)}\n*Validade:* ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}\n\nO documento completo em PDF pode ser solicitado ou retirado na loja.\nQualquer dúvida, estamos à disposição!`
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank')
    setWhatsappQuote(null)
  }

  const sendEmail = (quote: Quote) => {
    const subject = encodeURIComponent(`Orçamento ConstruMaster #${quote.id}`)
    const body = encodeURIComponent(
      `Olá ${quote.customer || 'Cliente'},\n\nSegue o resumo do seu orçamento:\n\nNº do Orçamento: ${quote.id}\nValor Total: ${formatCurrency(quote.total)}\nValidade: ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}\n\nFicamos à disposição para qualquer dúvida.\n\nAtenciosamente,\nEquipe ConstruMaster`,
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  if (isFormOpen) {
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {editingQuoteId ? 'Editar Orçamento' : 'Novo Orçamento'}
          </h1>
          <Button variant="outline" onClick={closeForm}>
            Cancelar
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-[calc(100vh-10rem)]">
          <div className="lg:col-span-2 flex flex-col gap-4 bg-card border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <CustomerCombobox
                  customers={customers}
                  value={customerId}
                  onChange={(val) => {
                    setCustomerId(val)
                    if (val !== 'none') {
                      setCustomerName(customers.find((c) => c.id === val)?.name || '')
                    } else {
                      setCustomerName('')
                    }
                  }}
                  allowWalkIn
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Nome do Cliente <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Ex: Maria Silva"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={cn(
                    !customerName.trim() && 'border-destructive focus-visible:ring-destructive',
                  )}
                />
                {!customerName.trim() && (
                  <p className="text-[10px] text-destructive">Campo obrigatório</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Validade do Orçamento <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={cn(!validUntil && 'border-destructive focus-visible:ring-destructive')}
                />
                {!validUntil && <p className="text-[10px] text-destructive">Data é obrigatória</p>}
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
            <ScrollArea className="flex-1 border rounded-md p-2 mt-2">
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
              {cart.length === 0 && (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  Adicione produtos para iniciar o orçamento.
                </div>
              )}
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
                disabled={cart.length === 0 || !customerName.trim() || !validUntil}
                onClick={handleSaveQuote}
              >
                {editingQuoteId ? 'Salvar Alterações' : 'Salvar Orçamento'}
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
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos Profissionais</h1>
          <p className="text-muted-foreground">Crie, gere PDFs e converta orçamentos em vendas.</p>
        </div>
        <Button onClick={handleNewQuote}>
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
              <TableHead className="text-right pr-6">Ações Rápidas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q) => {
              const isExpired =
                q.validUntil && new Date(q.validUntil) < new Date(new Date().setHours(0, 0, 0, 0))
              const isNearExpiration =
                q.validUntil &&
                !isExpired &&
                new Date(q.validUntil).getTime() - new Date().getTime() <= 48 * 60 * 60 * 1000

              return (
                <TableRow key={q.id}>
                  <TableCell className="pl-6 font-medium">
                    <div>{q.id}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {new Date(q.date).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{q.customer}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(q.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge
                        variant={q.status === 'Pendente' ? 'secondary' : 'default'}
                        className={q.status === 'Convertido' ? 'bg-emerald-500' : ''}
                      >
                        {q.status}
                      </Badge>
                      {q.status === 'Pendente' && q.validUntil && (
                        <span
                          className={cn(
                            'text-[10px] flex items-center font-medium',
                            isExpired
                              ? 'text-destructive'
                              : isNearExpiration
                                ? 'text-orange-500'
                                : 'text-muted-foreground',
                          )}
                          title={
                            isExpired
                              ? 'Expirado'
                              : isNearExpiration
                                ? 'Expira em breve'
                                : 'Validade'
                          }
                        >
                          {isExpired ? (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          ) : isNearExpiration ? (
                            <Clock className="h-3 w-3 mr-1" />
                          ) : null}
                          Vence:{' '}
                          {new Date(q.validUntil).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
                        onClick={() => sendEmail(q)}
                        title="Enviar por Email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8"
                        onClick={() => openWhatsappDialog(q)}
                        title="Enviar via WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        onClick={() => setA4Quote(q)}
                        title="Gerar PDF Profissional"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {q.status === 'Pendente' && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditQuote(q)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 w-8"
                            title="Editar Orçamento"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => convertQuoteToPreSale(q.id)}
                            className="hover:bg-primary/10 h-8 w-8"
                            title="Converter em Pré-Venda"
                          >
                            <ShoppingCart className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setSelectedQuoteId(q.id)}
                            className="hover:bg-emerald-50 hover:text-emerald-700 h-8 w-8"
                            title="Converter em Venda Direta"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
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

      {/* Professional A4 PDF Dialog */}
      <Dialog open={!!a4Quote} onOpenChange={(open) => !open && setA4Quote(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden a4-pdf-document">
          <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between print-hidden bg-background z-10">
            <DialogTitle className="flex items-center gap-2 text-indigo-700">
              <FileText className="h-5 w-5" /> Orçamento Profissional (PDF)
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setA4Quote(null)}>
                Fechar
              </Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={printA4PDF}>
                <Download className="h-4 w-4 mr-2" /> Salvar / Imprimir PDF
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-muted/30 p-8 flex justify-center print-hidden">
            <div className="bg-white shadow-xl a4-pdf-content-wrapper w-full max-w-[210mm] min-h-[297mm] p-10 text-black mx-auto relative">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-6 mb-8">
                <div className="flex items-center gap-4">
                  <img
                    src="https://img.usecurling.com/i?q=construction&shape=outline&color=azure"
                    alt="Logo"
                    className="w-16 h-16"
                  />
                  <div>
                    <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight">
                      CONSTRUMASTER
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                      Materiais de Construção e Acabamentos
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">CNPJ: 12.345.678/0001-90</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-indigo-50 text-indigo-800 px-4 py-2 rounded-md border border-indigo-100 mb-2 inline-block">
                    <h2 className="text-lg font-bold">ORÇAMENTO #{a4Quote?.id}</h2>
                  </div>
                  <p className="text-sm">
                    <strong>Data:</strong>{' '}
                    {a4Quote ? new Date(a4Quote.date).toLocaleDateString('pt-BR') : ''}
                  </p>
                  <p className="text-sm">
                    <strong>Validade:</strong>{' '}
                    {a4Quote?.validUntil
                      ? new Date(a4Quote.validUntil).toLocaleDateString('pt-BR', {
                          timeZone: 'UTC',
                        })
                      : '15 dias'}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Dados do Cliente
                </h3>
                <p className="text-lg font-bold text-gray-900">
                  {a4Quote?.customer || 'Consumidor Final'}
                </p>
                {a4Quote?.customerId && (
                  <p className="text-sm text-gray-600 mt-1">
                    Documento (CPF/CNPJ):{' '}
                    {customers.find((c) => c.id === a4Quote.customerId)?.document || '-'}
                  </p>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full mb-8">
                <thead>
                  <tr className="bg-indigo-900 text-white">
                    <th className="text-left py-3 px-4 rounded-tl-md font-semibold text-sm">
                      Item / Descrição
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Qtd</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">V. Unitário</th>
                    <th className="text-right py-3 px-4 rounded-tr-md font-semibold text-sm">
                      V. Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {a4Quote?.items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-sm text-gray-800">
                        {item.product.name}
                      </td>
                      <td className="text-center py-3 px-4 text-sm text-gray-600">
                        {item.quantity} <span className="text-xs">{item.product.unit}</span>
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-600">
                        {formatCurrency(item.product.price)}
                      </td>
                      <td className="text-right py-3 px-4 font-semibold text-sm text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-12">
                <div className="w-72 space-y-3">
                  {a4Quote?.discount ? (
                    <div className="flex justify-between items-center text-gray-600 text-sm border-b border-gray-100 pb-2">
                      <span>Subtotal:</span>
                      <span>{formatCurrency((a4Quote?.total || 0) + a4Quote.discount)}</span>
                    </div>
                  ) : null}
                  {a4Quote?.discount ? (
                    <div className="flex justify-between items-center text-red-500 text-sm border-b border-gray-100 pb-2">
                      <span>Desconto Aplicado:</span>
                      <span>-{formatCurrency(a4Quote.discount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <span className="font-bold text-indigo-900 text-lg">TOTAL ESTIMADO:</span>
                    <span className="font-black text-indigo-900 text-2xl">
                      {formatCurrency(a4Quote?.total || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer / Terms */}
              <div className="mt-auto pt-8 border-t border-gray-200">
                <h4 className="font-bold text-gray-800 text-sm mb-2">Termos e Condições</h4>
                <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                  <li>
                    Este documento não possui valor fiscal. Trata-se apenas de uma estimativa de
                    custos.
                  </li>
                  <li>
                    Os valores apresentados são válidos até a data de vencimento indicada no
                    cabeçalho.
                  </li>
                  <li>
                    A disponibilidade dos produtos está sujeita à confirmação de estoque no momento
                    da conversão em venda.
                  </li>
                  <li>Condições de pagamento serão acordadas no ato do faturamento.</li>
                </ul>
                <div className="mt-8 text-center text-sm font-bold text-indigo-900">
                  Obrigado por escolher a ConstruMaster!
                </div>
              </div>
            </div>
          </div>
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
