import { useState, useMemo } from 'react'
import { useAppContext, CashTransaction, PaymentMethod } from '@/context/AppContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Pencil,
  Ban,
  LockKeyhole,
  CalendarIcon,
} from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  startOfDay,
  endOfDay,
  format,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRange } from 'react-day-picker'
import { toast } from '@/hooks/use-toast'

export default function CashFlow() {
  const {
    sales,
    payables,
    products,
    cashTransactions,
    addCashTransaction,
    updateCashTransaction,
    cancelCashTransaction,
    cashClosings,
    addCashClosing,
  } = useAppContext()

  const [activeTab, setActiveTab] = useState('operacional')

  // Form states for insertion
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('Dinheiro')
  const [productId, setProductId] = useState<string>('none')
  const [quantity, setQuantity] = useState('1')

  // Date filter for history
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  })

  // Modal states
  const [isCloseOpen, setIsCloseOpen] = useState(false)
  const [realBalance, setRealBalance] = useState('')

  const [editTx, setEditTx] = useState<CashTransaction | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editMethod, setEditMethod] = useState<PaymentMethod>('Dinheiro')
  const [editProductId, setEditProductId] = useState<string>('none')
  const [editQuantity, setEditQuantity] = useState('1')

  const [cancelTxId, setCancelTxId] = useState<string | null>(null)

  // Metrics
  const chartDataSummary = useMemo(() => {
    const now = new Date()
    let receitas = 0
    let despesas = 0

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const start = startOfMonth(monthDate)
      const end = endOfMonth(monthDate)

      const monthSales = sales.filter(
        (s) => s.status === 'Pago' && isWithinInterval(new Date(s.date), { start, end }),
      )
      receitas += monthSales.reduce((acc, s) => acc + s.total, 0)

      const monthCash = cashTransactions.filter(
        (t) => t.status === 'Ativo' && isWithinInterval(new Date(t.timestamp), { start, end }),
      )
      receitas += monthCash.reduce((acc, t) => acc + t.amount, 0)

      const monthPayables = payables.filter((p) =>
        isWithinInterval(new Date(p.dueDate), { start, end }),
      )
      despesas += monthPayables.reduce((acc, p) => acc + p.amount, 0)
    }
    return { receitas, despesas }
  }, [sales, payables, cashTransactions])

  const projectedBalance = chartDataSummary.receitas - chartDataSummary.despesas

  // Closing calculations (only active and today)
  const closingTotals = useMemo(() => {
    const today = new Date()
    const start = startOfDay(today)
    const end = endOfDay(today)

    let dinheiro = 0,
      cartao = 0,
      pix = 0

    const sumMethod = (amt: number, met?: PaymentMethod) => {
      if (met === 'Dinheiro') dinheiro += amt
      else if (met === 'PIX') pix += amt
      else if (met === 'Cartão de Crédito' || met === 'Cartão de Débito') cartao += amt
    }

    cashTransactions
      .filter(
        (t) => t.status === 'Ativo' && isWithinInterval(new Date(t.timestamp), { start, end }),
      )
      .forEach((t) => sumMethod(t.amount, t.method))

    sales
      .filter((s) => s.status === 'Pago' && isWithinInterval(new Date(s.date), { start, end }))
      .forEach((s) => sumMethod(s.total, s.paymentMethod))

    return { dinheiro, cartao, pix, total: dinheiro + cartao + pix }
  }, [cashTransactions, sales])

  // Filters for History Table
  const filteredHistory = useMemo(() => {
    if (!dateRange?.from) return cashTransactions

    const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
    const start = startOfDay(dateRange.from)

    return cashTransactions
      .filter((t) => {
        const d = new Date(t.timestamp)
        return d >= start && d <= end
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [cashTransactions, dateRange])

  const sortedClosings = useMemo(() => {
    return [...cashClosings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [cashClosings])

  const handleRegisterSale = () => {
    const numAmount = parseFloat(amount.replace(',', '.'))
    const numQuantity = parseInt(quantity, 10)

    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Valor inválido',
        description: 'Por favor, insira um valor maior que zero.',
      })
      return
    }

    addCashTransaction({
      amount: numAmount,
      method,
      productId: productId !== 'none' ? productId : undefined,
      quantity: productId !== 'none' ? numQuantity : undefined,
    })

    setAmount('')
    setProductId('none')
    setQuantity('1')
  }

  const handleCloseCash = () => {
    const rBalance = parseFloat(realBalance.replace(',', '.')) || 0
    addCashClosing({
      date: new Date().toISOString(),
      systemTotal: closingTotals.total,
      realTotal: rBalance,
      difference: rBalance - closingTotals.total,
      details: {
        dinheiro: closingTotals.dinheiro,
        cartao: closingTotals.cartao,
        pix: closingTotals.pix,
      },
    })
    setIsCloseOpen(false)
    setRealBalance('')
    setActiveTab('fechamentos')
  }

  const openEditModal = (tx: CashTransaction) => {
    setEditTx(tx)
    setEditAmount(tx.amount.toString())
    setEditMethod(tx.method)
    setEditProductId(tx.productId || 'none')
    setEditQuantity((tx.quantity || 1).toString())
  }

  const handleUpdateTransaction = () => {
    if (!editTx) return
    const numAmount = parseFloat(editAmount.replace(',', '.'))
    const numQuantity = parseInt(editQuantity, 10)

    if (isNaN(numAmount) || numAmount <= 0) return

    updateCashTransaction(editTx.id, {
      amount: numAmount,
      method: editMethod,
      productId: editProductId !== 'none' ? editProductId : undefined,
      quantity: editProductId !== 'none' ? numQuantity : undefined,
    })

    setEditTx(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Caixa Diário e Fluxo</h1>
          <p className="text-muted-foreground">
            Registre entradas avulsas, faça o fechamento e acompanhe o financeiro.
          </p>
        </div>
        <Button
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 font-bold"
          onClick={() => setIsCloseOpen(true)}
        >
          <LockKeyhole className="h-4 w-4 mr-2" /> Fechar Caixa
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-2xl mb-4">
          <TabsTrigger value="operacional">Operacional & Registros</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Transações</TabsTrigger>
          <TabsTrigger value="fechamentos">Fechamentos Realizados</TabsTrigger>
        </TabsList>

        <TabsContent value="operacional" className="space-y-6 mt-0">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-emerald-50/50 border-emerald-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-800">
                  Total de Receitas
                </CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(chartDataSummary.receitas)}
                </div>
                <p className="text-xs text-emerald-600/80">Vendas e caixa (6 meses)</p>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-destructive">
                  Total de Despesas
                </CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(chartDataSummary.despesas)}
                </div>
                <p className="text-xs text-destructive/80">Baseado em compras (6 meses)</p>
              </CardContent>
            </Card>
            <Card
              className={cn(
                'border',
                projectedBalance >= 0
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-orange-50 border-orange-200',
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={cn(
                    'text-sm font-medium',
                    projectedBalance >= 0 ? 'text-primary' : 'text-orange-800',
                  )}
                >
                  Saldo Projetado
                </CardTitle>
                <Wallet
                  className={cn(
                    'h-4 w-4',
                    projectedBalance >= 0 ? 'text-primary' : 'text-orange-600',
                  )}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    projectedBalance >= 0 ? 'text-primary' : 'text-orange-700',
                  )}
                >
                  {formatCurrency(projectedBalance)}
                </div>
                <p
                  className={cn(
                    'text-xs',
                    projectedBalance >= 0 ? 'text-primary/80' : 'text-orange-600/80',
                  )}
                >
                  Receitas - Despesas
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="max-w-3xl border-primary/20 shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle>Nova Entrada de Caixa Rápida</CardTitle>
              <CardDescription>
                Registre uma venda direta no caixa. Selecione um produto para abater do estoque
                automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>
                    Valor da Entrada (R$) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Produto Vinculado (Opcional - Abate Estoque)</Label>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto se aplicável..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Nenhum produto (Apenas registro financeiro)
                      </SelectItem>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - Estoque: {p.stock} {p.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {productId !== 'none' && (
                  <div className="space-y-2 md:col-span-2 animate-in fade-in zoom-in-95">
                    <Label>Quantidade Vendida</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
              <Button className="w-full mt-2 h-11" onClick={handleRegisterSale}>
                Registrar Entrada de Caixa
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4 mt-0">
          <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/30 p-4 border-b gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg">Histórico de Caixa Rápido</CardTitle>
                <CardDescription>
                  Consulte, edite ou estorne entradas manuais no caixa.
                </CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-[260px] justify-start text-left font-normal bg-background',
                      !dateRange && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd/MM/yyyy')} -{' '}
                          {format(dateRange.to, 'dd/MM/yyyy')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy')
                      )
                    ) : (
                      <span>Filtrar por data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Data/Hora</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Produto Vinculado</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right pr-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((t) => {
                    const product = t.productId ? products.find((p) => p.id === t.productId) : null
                    return (
                      <TableRow
                        key={t.id}
                        className={t.status === 'Cancelado' ? 'opacity-50 bg-muted/50' : ''}
                      >
                        <TableCell className="pl-6 whitespace-nowrap">
                          {format(new Date(t.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{t.method}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(t.amount)}</TableCell>
                        <TableCell>
                          {product ? (
                            <div className="text-xs">
                              {product.name} <br />{' '}
                              <span className="text-muted-foreground">Qtd: {t.quantity}</span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={t.status === 'Ativo' ? 'default' : 'destructive'}
                            className={t.status === 'Ativo' ? 'bg-emerald-500' : ''}
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          {t.status === 'Ativo' && (
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditModal(t)}>
                                <Pencil className="h-4 w-4 text-indigo-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCancelTxId(t.id)}
                              >
                                <Ban className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma transação encontrada no período.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fechamentos" className="space-y-4 mt-0">
          <Card>
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle>Histórico de Fechamentos</CardTitle>
              <CardDescription>Conferência diária do sistema com o caixa físico.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Data de Apuração</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead className="text-right">Sistema (R$)</TableHead>
                    <TableHead className="text-right">Real Informado (R$)</TableHead>
                    <TableHead className="text-right pr-6">Diferença</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedClosings.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="pl-6 whitespace-nowrap">
                        {format(new Date(c.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground leading-relaxed">
                        Dinheiro: {formatCurrency(c.details.dinheiro)} <br />
                        Cartão: {formatCurrency(c.details.cartao)} <br />
                        PIX: {formatCurrency(c.details.pix)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(c.systemTotal)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(c.realTotal)}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge
                          variant={c.difference === 0 ? 'outline' : 'destructive'}
                          className={cn(
                            c.difference === 0 &&
                              'text-emerald-600 border-emerald-200 bg-emerald-50',
                          )}
                        >
                          {c.difference > 0 ? '+' : ''}
                          {formatCurrency(c.difference)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedClosings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum fechamento de caixa registrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Transaction Modal */}
      <Dialog open={!!editTx} onOpenChange={(o) => !o && setEditTx(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Transação de Caixa</DialogTitle>
            <DialogDescription>Altere valores ou vínculos com o estoque.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Valor da Entrada (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={editMethod} onValueChange={(v) => setEditMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Produto Vinculado</Label>
              <Select value={editProductId} onValueChange={setEditProductId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum produto</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editProductId !== 'none' && (
              <div className="space-y-2">
                <Label>Quantidade a abater</Label>
                <Input
                  type="number"
                  min="1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTx(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTransaction}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirm Modal */}
      <Dialog open={!!cancelTxId} onOpenChange={(o) => !o && setCancelTxId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirmar Estorno</DialogTitle>
            <DialogDescription>
              Deseja realmente cancelar esta transação? Os valores serão removidos do caixa e o
              estoque será devolvido, caso haja um produto vinculado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCancelTxId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (cancelTxId) cancelCashTransaction(cancelTxId)
                setCancelTxId(null)
              }}
            >
              Confirmar Estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fechar Caixa Modal */}
      <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5" /> Fechamento Diário
            </DialogTitle>
            <DialogDescription>
              Confronto das entradas de Venda do Sistema x Dinheiro em Caixa (Apurado hoje).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted/50 p-4 rounded-md space-y-2 border">
              <div className="flex justify-between text-sm">
                <span>Dinheiro:</span>
                <span className="font-medium">{formatCurrency(closingTotals.dinheiro)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cartões:</span>
                <span className="font-medium">{formatCurrency(closingTotals.cartao)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>PIX:</span>
                <span className="font-medium">{formatCurrency(closingTotals.pix)}</span>
              </div>
              <div className="pt-3 mt-1 border-t flex justify-between font-bold text-base">
                <span>Total Apurado (Sistema):</span>
                <span className="text-primary">{formatCurrency(closingTotals.total)}</span>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Label htmlFor="realBalance">
                Total Físico / Real em Caixa (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="realBalance"
                type="number"
                placeholder="0.00"
                value={realBalance}
                onChange={(e) => setRealBalance(e.target.value)}
                className="h-12 text-lg font-medium"
              />
              {realBalance !== '' && (
                <div className="flex justify-end pt-1">
                  <p
                    className={cn(
                      'text-xs font-bold px-2 py-1 rounded-md',
                      (parseFloat(realBalance.replace(',', '.')) || 0) === closingTotals.total
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    Diferença:{' '}
                    {formatCurrency(
                      (parseFloat(realBalance.replace(',', '.')) || 0) - closingTotals.total,
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCloseCash}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={realBalance === ''}
            >
              Finalizar Expediente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
