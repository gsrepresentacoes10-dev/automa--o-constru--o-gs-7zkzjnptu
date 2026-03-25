import { useState, useMemo, useEffect } from 'react'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency, cn } from '@/lib/utils'
import {
  Search,
  AlertTriangle,
  TrendingUp,
  CalendarClock,
  ShoppingCart,
  Calculator,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Mail,
  Printer,
  LineChart,
  MessageCircle,
  Check,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

export default function Purchases() {
  const { products, sales, suppliers, updateProduct, addPurchase, addPayable } = useAppContext()

  // Advanced Procurement Filters
  const [descriptionSearch, setDescriptionSearch] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [brandFilter, setBrandFilter] = useState('all')

  const [sortBy, setSortBy] = useState<'urgency' | 'name'>('urgency')
  const [purchaseFilter, setPurchaseFilter] = useState<string>('all')

  const [leadTimeInputs, setLeadTimeInputs] = useState<Record<string, string>>({})

  const [isCalcOpen, setIsCalcOpen] = useState(false)
  const [calcProduct, setCalcProduct] = useState<any>(null)
  const [calcMargin, setCalcMargin] = useState<number>(40)

  // New Purchase State
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState('none')
  const [purchaseItems, setPurchaseItems] = useState<
    { product: any; quantity: number; costPrice: number }[]
  >([])
  const [installments, setInstallments] = useState<{ dueDate: string; amount: number }[]>([])
  const [filterCategory, setFilterCategory] = useState('all')

  // Order Generation State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false)
  const [whatsappSupplierId, setWhatsappSupplierId] = useState('none')

  // Auto Quote State
  const [isAutoQuoteOpen, setIsAutoQuoteOpen] = useState(false)
  const [quoteStep, setQuoteStep] = useState<'select' | 'compare'>('select')
  const [selectedQuoteSuppliers, setSelectedQuoteSuppliers] = useState<string[]>([])
  const [mockedQuotes, setMockedQuotes] = useState<
    Record<
      string,
      { total: number; items: Record<string, { unitPrice: number; subtotal: number }> }
    >
  >({})

  // Forecast State
  const [forecastPeriod, setForecastPeriod] = useState('3') // months

  const uniqueBrands = useMemo(() => {
    const brands = products.map((p) => p.brand).filter(Boolean) as string[]
    return Array.from(new Set(brands)).sort()
  }, [products])

  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    suppliers.forEach((s) => s.categories?.forEach((c) => cats.add(c)))
    return Array.from(cats).sort()
  }, [suppliers])

  const filteredSuppliersForEntry = useMemo(() => {
    if (filterCategory === 'all') return suppliers
    return suppliers.filter((s) =>
      s.categories?.some((c) => c.toLowerCase() === filterCategory.toLowerCase()),
    )
  }, [suppliers, filterCategory])

  const newPurchaseTotal = useMemo(
    () => purchaseItems.reduce((acc, item) => acc + item.quantity * item.costPrice, 0),
    [purchaseItems],
  )

  useEffect(() => {
    if (installments.length <= 1) {
      setInstallments([{ dueDate: installments[0]?.dueDate || '', amount: newPurchaseTotal }])
    }
  }, [newPurchaseTotal])

  const handleLeadTimeChange = (id: string, value: string) => {
    setLeadTimeInputs((prev) => ({ ...prev, [id]: value }))
  }

  const saveLeadTime = (id: string, value: string) => {
    if (value === '') {
      updateProduct(id, { leadTime: undefined }, true)
      setLeadTimeInputs((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } else {
      const numValue = parseInt(value, 10)
      const validValue = isNaN(numValue) || numValue < 0 ? 0 : numValue
      updateProduct(id, { leadTime: validValue }, true)
      setLeadTimeInputs((prev) => ({ ...prev, [id]: validValue.toString() }))
    }
  }

  const openCalculator = (product: any) => {
    setCalcProduct(product)
    setCalcMargin(40)
    setIsCalcOpen(true)
  }

  const suggestedPrice = useMemo(() => {
    if (!calcProduct) return 0
    if (calcMargin >= 100) return calcProduct.costPrice * 2
    return calcProduct.costPrice / (1 - calcMargin / 100)
  }, [calcProduct, calcMargin])

  const applySuggestedPrice = () => {
    if (calcProduct) {
      updateProduct(calcProduct.id, { price: suggestedPrice })
      toast({
        title: 'Preço atualizado',
        description: `O preço de venda de ${calcProduct.name} foi ajustado para ${formatCurrency(suggestedPrice)}.`,
      })
      setIsCalcOpen(false)
    }
  }

  const replenishmentData = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const dataWithSales = products.map((product) => {
      const sold30d = sales.reduce((acc, sale) => {
        if (new Date(sale.date) >= thirtyDaysAgo && sale.status !== 'Cancelado') {
          const item = sale.items.find((i) => i.product.id === product.id)
          return acc + (item ? item.quantity : 0)
        }
        return acc
      }, 0)

      const revenue30d = sold30d * product.price
      const dailyAvg = sold30d / 30
      const daysOfCover = dailyAvg > 0 ? Math.floor(product.stock / dailyAvg) : Infinity

      const leadTime = product.leadTime || 0
      const targetStock = Math.ceil(Math.max(product.minStock, dailyAvg * (30 + leadTime)))
      const suggestedPurchase = Math.max(0, targetStock - product.stock)
      const healthPercentage =
        targetStock > 0 ? Math.min(100, (product.stock / targetStock) * 100) : 100

      let stockZeroDate: Date | null = null
      if (daysOfCover !== Infinity && product.stock > 0) {
        stockZeroDate = new Date(now.getTime() + daysOfCover * 24 * 60 * 60 * 1000)
      }

      let status: 'critical' | 'warning' | 'good' = 'good'
      if (product.stock <= 0 || daysOfCover <= 7) status = 'critical'
      else if (product.stock <= product.minStock || daysOfCover <= 15) status = 'warning'

      let purchaseStatus: 'OK' | 'Sugerido' = 'OK'
      if (suggestedPurchase > 0) purchaseStatus = 'Sugerido'

      return {
        ...product,
        sold30d,
        revenue30d,
        dailyAvg,
        daysOfCover,
        stockZeroDate,
        suggestedPurchase,
        healthPercentage,
        status,
        targetStock,
        purchaseStatus,
      }
    })

    const sortedByRevenue = [...dataWithSales].sort((a, b) => b.revenue30d - a.revenue30d)
    const totalRevenue = sortedByRevenue.reduce((acc, p) => acc + p.revenue30d, 0)
    let cumulativeRevenue = 0
    const abcMap = new Map<string, 'A' | 'B' | 'C'>()

    sortedByRevenue.forEach((p) => {
      if (totalRevenue === 0) {
        abcMap.set(p.id, 'C')
        return
      }
      cumulativeRevenue += p.revenue30d
      const cumPerc = cumulativeRevenue / totalRevenue
      if (cumPerc <= 0.8) abcMap.set(p.id, 'A')
      else if (cumPerc <= 0.95) abcMap.set(p.id, 'B')
      else abcMap.set(p.id, 'C')
    })

    return dataWithSales.map((p) => ({
      ...p,
      abcClass: abcMap.get(p.id) || 'C',
    }))
  }, [products, sales])

  const criticalProducts = useMemo(() => {
    return replenishmentData.filter((p) => p.stock <= p.minStock)
  }, [replenishmentData])

  const filteredAndSortedData = useMemo(() => {
    let result = replenishmentData.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(descriptionSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(descriptionSearch.toLowerCase()) ||
        (p.barcode && p.barcode.includes(descriptionSearch))

      const matchesLowStock = showLowStock ? p.stock <= p.minStock : true
      const matchesBrand = brandFilter === 'all' ? true : p.brand === brandFilter

      return matchesSearch && matchesLowStock && matchesBrand
    })

    if (purchaseFilter !== 'all') {
      if (purchaseFilter === 'sugerido') {
        result = result.filter((p) => p.purchaseStatus === 'Sugerido')
      }
    }

    return result.sort((a, b) => {
      if (sortBy === 'urgency') {
        if (a.daysOfCover === b.daysOfCover) return a.stock - b.stock
        return a.daysOfCover - b.daysOfCover
      }
      return a.name.localeCompare(b.name)
    })
  }, [replenishmentData, descriptionSearch, showLowStock, brandFilter, sortBy, purchaseFilter])

  const summary = useMemo(() => {
    return replenishmentData.reduce(
      (acc, item) => {
        if (item.status === 'critical') acc.critical++
        if (item.purchaseStatus === 'Sugerido') {
          acc.itemsToBuy++
          acc.investment += item.suggestedPurchase * item.costPrice
        }
        return acc
      },
      { critical: 0, itemsToBuy: 0, investment: 0 },
    )
  }, [replenishmentData])

  const orderValue = useMemo(() => {
    return filteredAndSortedData.reduce(
      (acc, p) =>
        acc + (p.suggestedPurchase > 0 ? p.suggestedPurchase : p.targetStock) * p.costPrice,
      0,
    )
  }, [filteredAndSortedData])

  const forecastData = useMemo(() => {
    const months = parseInt(forecastPeriod, 10)
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    return products
      .map((p) => {
        const sold = sales.reduce((acc, s) => {
          if (new Date(s.date) >= startDate && s.status !== 'Cancelado') {
            const item = s.items.find((i) => i.product.id === p.id)
            if (item) acc += item.quantity
          }
          return acc
        }, 0)

        const avg = sold / months
        const suggested = Math.max(0, Math.ceil(avg * 1.5 - p.stock))
        const suggestedSuppliers = suppliers
          .filter((s) => s.categories?.some((c) => c.toLowerCase() === p.category.toLowerCase()))
          .map((s) => s.name)
          .join(', ')

        return { ...p, sold, avg, suggested, suggestedSuppliers }
      })
      .sort((a, b) => b.suggested - a.suggested)
  }, [products, sales, suppliers, forecastPeriod])

  const addPurchaseItem = (productId: string) => {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    if (!purchaseItems.find((c) => c.product.id === p.id)) {
      setPurchaseItems([...purchaseItems, { product: p, quantity: 1, costPrice: p.costPrice }])
    }
  }

  const updatePurchaseItem = (id: string, field: 'quantity' | 'costPrice', value: number) => {
    setPurchaseItems((prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, [field]: value } : i)),
    )
  }

  const handleGenerateInstallments = (count: number) => {
    const amountPerInst = newPurchaseTotal / count
    const newInsts = Array.from({ length: count }).map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() + (i + 1) * 30) // +30 days each
      return { dueDate: date.toISOString().split('T')[0], amount: amountPerInst }
    })
    setInstallments(newInsts)
  }

  const handleSavePurchase = () => {
    if (selectedSupplier === 'none' || purchaseItems.length === 0) {
      toast({ variant: 'destructive', title: 'Preencha os campos obrigatórios' })
      return
    }

    const instSum = installments.reduce((acc, curr) => acc + curr.amount, 0)
    if (installments.length === 0 || installments.some((i) => !i.dueDate || i.amount <= 0)) {
      toast({
        variant: 'destructive',
        title: 'Atenção',
        description:
          'É necessário registrar os valores e datas de vencimento para prosseguir com a entrada de mercadoria.',
      })
      return
    }

    if (Math.abs(newPurchaseTotal - instSum) > 0.01) {
      toast({
        variant: 'destructive',
        title: 'Valores Incorretos',
        description: 'A soma das parcelas deve ser exatamente igual ao valor total da nota.',
      })
      return
    }

    const supplierName = suppliers.find((s) => s.id === selectedSupplier)?.name || ''

    const p = addPurchase({
      supplierId: selectedSupplier,
      supplierName,
      items: purchaseItems,
      total: newPurchaseTotal,
    })

    installments.forEach((inst, i) => {
      addPayable({
        supplierId: selectedSupplier,
        supplierName,
        description: `Parcela ${i + 1}/${installments.length} - Compra #${p.id}`,
        amount: inst.amount,
        dueDate: new Date(inst.dueDate).toISOString(),
        purchaseId: p.id,
      })
    })

    setIsNewPurchaseOpen(false)
    setPurchaseItems([])
    setSelectedSupplier('none')
    setInstallments([])
  }

  const printOrder = () => {
    document.body.classList.add('printing-order')
    window.print()
    setTimeout(() => document.body.classList.remove('printing-order'), 500)
  }

  const sendOrderEmail = () => {
    const subject = encodeURIComponent('Solicitação de Cotação / Pedido de Compra - ConstruMaster')
    const bodyText =
      'Olá,\n\nGostaríamos de solicitar cotação e verificar disponibilidade para os seguintes itens:\n\n' +
      filteredAndSortedData
        .map(
          (p) =>
            `- ${p.name} | Qtd Sugerida: ${p.suggestedPurchase > 0 ? p.suggestedPurchase : p.targetStock} un`,
        )
        .join('\n') +
      '\n\nFicamos no aguardo do retorno.\n\nAtenciosamente,\nEquipe ConstruMaster'
    const body = encodeURIComponent(bodyText)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const sendOrderWhatsapp = () => {
    if (whatsappSupplierId === 'none') {
      toast({ variant: 'destructive', title: 'Selecione um fornecedor para enviar via WhatsApp' })
      return
    }
    const supplier = suppliers.find((s) => s.id === whatsappSupplierId)
    if (!supplier || !supplier.contact) {
      toast({
        variant: 'destructive',
        title: 'Contato não encontrado',
        description:
          'Por favor, atualize o cadastro do fornecedor com um número de telefone válido.',
      })
      return
    }

    const phone = supplier.contact.replace(/\D/g, '')
    if (!phone || phone.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Telefone inválido',
        description: 'O número de telefone registrado para este fornecedor é inválido.',
      })
      return
    }

    const itemsText = filteredAndSortedData
      .map((p) => `- ${p.suggestedPurchase > 0 ? p.suggestedPurchase : p.targetStock}x ${p.name}`)
      .join('\n')
    const text = `Olá parceiro(a),\nSomos da ConstruMaster e gostaríamos de solicitar o seguinte pedido de reposição de estoque:\n\n*Itens Solicitados:*\n${itemsText}\n\n*Valor Estimado:* ${formatCurrency(orderValue)}\n\nPor favor, nos confirme a disponibilidade, valores finais e previsão de entrega.\n\nFicamos no aguardo. Obrigado!`

    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, '_blank')
    setIsWhatsappModalOpen(false)
  }

  // --- Auto Quote Integration ---
  const requiredCategories = useMemo(() => {
    const cats = new Set<string>()
    filteredAndSortedData.forEach((p) => {
      if (p.category) cats.add(p.category.toLowerCase())
    })
    return Array.from(cats)
  }, [filteredAndSortedData])

  const displaySuppliersForQuote = useMemo(() => {
    const eligible = suppliers.filter((s) =>
      s.categories?.some((c) => requiredCategories.includes(c.toLowerCase())),
    )
    return eligible.length > 0 ? eligible : suppliers
  }, [suppliers, requiredCategories])

  const openAutoQuote = () => {
    setSelectedQuoteSuppliers(displaySuppliersForQuote.map((s) => s.id))
    setQuoteStep('select')
    setIsAutoQuoteOpen(true)
  }

  const handleGenerateQuotes = () => {
    const quotes: Record<
      string,
      { total: number; items: Record<string, { unitPrice: number; subtotal: number }> }
    > = {}

    selectedQuoteSuppliers.forEach((suppId) => {
      let total = 0
      const items: Record<string, { unitPrice: number; subtotal: number }> = {}

      filteredAndSortedData.forEach((p) => {
        const qty = p.suggestedPurchase > 0 ? p.suggestedPurchase : p.targetStock
        if (qty === 0) return
        const variation = Math.random() * 0.3 - 0.15 // -15% to +15% variation
        const unitPrice = p.costPrice > 0 ? p.costPrice * (1 + variation) : 10 * (1 + variation)
        const subtotal = unitPrice * qty
        items[p.id] = { unitPrice, subtotal }
        total += subtotal
      })
      quotes[suppId] = { total, items }
    })

    setMockedQuotes(quotes)
    setQuoteStep('compare')
  }

  const handleSelectWinner = (suppId: string) => {
    setIsAutoQuoteOpen(false)
    setWhatsappSupplierId(suppId)
    setIsWhatsappModalOpen(true)
    toast({
      title: 'Cotação Aprovada',
      description: 'Você pode agora enviar o pedido final ao fornecedor.',
    })
  }

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body.printing-order * {
            visibility: hidden;
            color: #000 !important;
          }
          body.printing-order .order-print-container,
          body.printing-order .order-print-container * {
            visibility: visible;
          }
          body.printing-order .order-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          body.printing-order .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Compras</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Planeje reposições, gere pedidos e lance novas entradas de mercadoria.
          </p>
        </div>
        <Button onClick={() => setIsNewPurchaseOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Entrada de Mercadoria
        </Button>
      </div>

      <Tabs defaultValue="planejamento" className="space-y-6">
        <TabsList>
          <TabsTrigger value="planejamento">Planejamento de Reposição</TabsTrigger>
          <TabsTrigger value="previsao">Previsão de Vendas (Forecast)</TabsTrigger>
        </TabsList>

        <TabsContent value="planejamento" className="space-y-6">
          {criticalProducts.length > 0 && (
            <Alert
              variant="destructive"
              className="bg-destructive/5 border-destructive/20 text-destructive"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção: Estoque Crítico</AlertTitle>
              <AlertDescription>
                Existem {criticalProducts.length} produto(s) que atingiram ou estão abaixo do
                estoque mínimo. Sugerimos priorizar a reposição desses itens.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-destructive">
                  Estoque Crítico
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{summary.critical}</div>
                <p className="text-xs text-destructive/80 mt-1">Produtos zerados ou &lt; 7 dias</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-primary/20">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Fazer Pedido</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.itemsToBuy}</div>
                <p className="text-xs text-muted-foreground mt-1">Sugestões de reposição</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-primary">
                  Previsão Sugerida
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(summary.investment)}
                </div>
                <p className="text-xs text-primary/80 mt-1">Estimativa p/ novos pedidos</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-muted/20 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <Label>Descrição</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por descrição, nome ou SKU..."
                      className="pl-9"
                      value={descriptionSearch}
                      onChange={(e) => setDescriptionSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="w-full sm:w-[150px] space-y-1.5">
                  <Label>Marca</Label>
                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {uniqueBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-[150px] space-y-1.5">
                  <Label>Status do Pedido</Label>
                  <Select value={purchaseFilter} onValueChange={setPurchaseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="sugerido">Sugeridos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-[150px] space-y-1.5">
                  <Label>Ordenar por</Label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'urgency' | 'name')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgency">Urgência</SelectItem>
                      <SelectItem value="name">Nome (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-2 bg-background w-fit border px-3 py-2 rounded-md shadow-sm">
                  <Checkbox
                    id="low-stock-filter"
                    checked={showLowStock}
                    onCheckedChange={(c) => setShowLowStock(c as boolean)}
                  />
                  <Label
                    htmlFor="low-stock-filter"
                    className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Estoque Baixo
                  </Label>
                </div>
                <Button
                  variant={showLowStock ? 'default' : 'outline'}
                  disabled={filteredAndSortedData.length === 0}
                  onClick={openAutoQuote}
                >
                  <FileText className="mr-2 h-4 w-4" /> Gerar Pedido de Compra
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto / Marca</TableHead>
                    <TableHead>Saúde do Estoque</TableHead>
                    <TableHead className="text-center">Vendas (30d) / Média</TableHead>
                    <TableHead className="text-center w-[100px]">Prazo (Dias)</TableHead>
                    <TableHead className="text-center">Cobertura / Fim</TableHead>
                    <TableHead className="text-center w-[240px]">Status da Compra / Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 mb-1.5 flex items-center gap-2">
                          <span>SKU: {item.sku}</span>
                          {item.brand && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span className="font-medium">{item.brand}</span>
                            </>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0',
                            item.abcClass === 'A' &&
                              'bg-emerald-50 text-emerald-700 border-emerald-200',
                            item.abcClass === 'B' && 'bg-blue-50 text-blue-700 border-blue-200',
                            item.abcClass === 'C' && 'bg-slate-50 text-slate-600 border-slate-200',
                          )}
                        >
                          Curva {item.abcClass}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 w-full max-w-[130px]">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-medium text-foreground">Atual: {item.stock}</span>
                            <span className="text-muted-foreground">Alvo: {item.targetStock}</span>
                          </div>
                          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all',
                                item.status === 'critical'
                                  ? 'bg-destructive'
                                  : item.status === 'warning'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500',
                              )}
                              style={{ width: `${item.healthPercentage}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-medium">{item.sold30d} un</div>
                        <div className="text-[10px] text-muted-foreground">
                          {item.dailyAvg.toFixed(1)} un/dia
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <div className="flex flex-col items-center justify-center gap-1 w-16 mx-auto">
                          <Input
                            type="number"
                            min="0"
                            className="h-8 text-center px-1 text-xs"
                            value={
                              leadTimeInputs[item.id] !== undefined
                                ? leadTimeInputs[item.id]
                                : (item.leadTime ?? '')
                            }
                            placeholder="0"
                            onChange={(e) => handleLeadTimeChange(item.id, e.target.value)}
                            onBlur={(e) => saveLeadTime(item.id, e.target.value)}
                          />
                          {item.leadTime === undefined && (
                            <span
                              className="text-[9px] text-muted-foreground/70 leading-none whitespace-nowrap"
                              title="Calculando com 0 dias"
                            >
                              Padrão: 0
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {item.daysOfCover === Infinity ? (
                            <Badge variant="outline" className="text-muted-foreground font-normal">
                              Sem vendas
                            </Badge>
                          ) : (
                            <Badge
                              variant={item.status === 'critical' ? 'destructive' : 'outline'}
                              className={cn(
                                item.status === 'warning' &&
                                  'bg-amber-100 text-amber-800 border-amber-200',
                                item.status === 'good' &&
                                  'bg-emerald-50 text-emerald-700 border-emerald-200 font-normal',
                              )}
                            >
                              {item.daysOfCover} dias
                            </Badge>
                          )}
                          {item.stockZeroDate && (
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <CalendarClock className="h-3 w-3 text-muted-foreground" />
                              <span
                                className={
                                  item.status === 'critical' ? 'text-destructive font-medium' : ''
                                }
                              >
                                {item.stockZeroDate.toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          {item.purchaseStatus === 'Sugerido' ? (
                            <Badge
                              variant="outline"
                              className="border-primary/50 text-primary px-2"
                            >
                              Sugerido: {item.suggestedPurchase} un
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm flex items-center justify-center">
                              Estoque OK
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCalculator(item)}
                            className="h-8 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            title="Sugerir Preço de Venda Baseado no Custo"
                          >
                            <Calculator className="h-3.5 w-3.5 mr-1.5" /> Preço
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAndSortedData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum produto encontrado com os filtros aplicados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="previsao" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4 bg-muted/20">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" /> Previsão de Vendas (Forecast)
                </CardTitle>
                <CardDescription>
                  Avalia o histórico de saída e sugere a compra ideal baseada na média mensal e
                  margem de segurança.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Label className="whitespace-nowrap">Período de Análise:</Label>
                <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                  <SelectTrigger className="w-[140px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Último Mês</SelectItem>
                    <SelectItem value="3">Últimos 3 Meses</SelectItem>
                    <SelectItem value="6">Últimos 6 Meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Produto / Categoria</TableHead>
                    <TableHead className="text-center">Estoque Atual</TableHead>
                    <TableHead className="text-center">Vendas ({forecastPeriod}m)</TableHead>
                    <TableHead className="text-center">Média Mensal</TableHead>
                    <TableHead className="text-center">Sugestão de Compra</TableHead>
                    <TableHead className="pr-6">Fornecedores Sugeridos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecastData.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="pl-6">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.category}</div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{p.stock}</TableCell>
                      <TableCell className="text-center">{p.sold}</TableCell>
                      <TableCell className="text-center">{p.avg.toFixed(1)}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={p.suggested > 0 ? 'default' : 'outline'}
                          className={p.suggested > 0 ? 'bg-primary' : 'text-muted-foreground'}
                        >
                          {p.suggested} un
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6">
                        <span
                          className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]"
                          title={p.suggestedSuppliers}
                        >
                          {p.suggestedSuppliers || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAutoQuoteOpen} onOpenChange={setIsAutoQuoteOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
          <DialogHeader className="p-6 border-b shrink-0">
            <DialogTitle>Cotação Automática de Pedido</DialogTitle>
            <DialogDescription>
              {quoteStep === 'select'
                ? 'Selecione os fornecedores para enviar o pedido de cotação. Sugerimos os que atendem às categorias dos produtos listados.'
                : 'Compare os valores simulados recebidos dos fornecedores selecionados e escolha a melhor opção.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-6 bg-muted/10">
            {quoteStep === 'select' && (
              <div className="space-y-6">
                <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Fornecedores Elegíveis Encontrados
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {displaySuppliersForQuote.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="flex items-start space-x-3 border p-3 rounded-md bg-background hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`quote-supp-${supplier.id}`}
                          className="mt-0.5"
                          checked={selectedQuoteSuppliers.includes(supplier.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedQuoteSuppliers((prev) => [...prev, supplier.id])
                            } else {
                              setSelectedQuoteSuppliers((prev) =>
                                prev.filter((id) => id !== supplier.id),
                              )
                            }
                          }}
                        />
                        <div className="flex flex-col flex-1 leading-none">
                          <Label
                            htmlFor={`quote-supp-${supplier.id}`}
                            className="cursor-pointer font-medium text-sm"
                          >
                            {supplier.name}
                          </Label>
                          <span
                            className="text-[11px] text-muted-foreground mt-1.5 line-clamp-1"
                            title={supplier.categories?.join(', ')}
                          >
                            {supplier.categories?.join(', ') || 'Sem categoria'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {quoteStep === 'compare' && (
              <div className="bg-card border rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="min-w-[200px] border-r">Produto</TableHead>
                        <TableHead className="text-center w-[80px] border-r">Qtd</TableHead>
                        {selectedQuoteSuppliers.map((sId) => (
                          <TableHead key={sId} className="text-right min-w-[140px]">
                            {suppliers.find((s) => s.id === sId)?.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedData.map((p) => {
                        const qty = p.suggestedPurchase > 0 ? p.suggestedPurchase : p.targetStock
                        if (qty === 0) return null
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="border-r">
                              <div
                                className="font-medium text-sm truncate max-w-[250px]"
                                title={p.name}
                              >
                                {p.name}
                              </div>
                              <div className="text-xs text-muted-foreground">{p.brand || '-'}</div>
                            </TableCell>
                            <TableCell className="text-center border-r bg-muted/10 font-medium">
                              {qty}
                            </TableCell>
                            {selectedQuoteSuppliers.map((sId) => (
                              <TableCell key={sId} className="text-right">
                                <div className="font-medium">
                                  {formatCurrency(mockedQuotes[sId]?.items[p.id]?.subtotal || 0)}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  {formatCurrency(mockedQuotes[sId]?.items[p.id]?.unitPrice || 0)}{' '}
                                  un
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                    <TableFooter className="bg-muted/20">
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-right font-semibold text-sm py-6 border-r"
                        >
                          TOTAL DA COTAÇÃO
                        </TableCell>
                        {selectedQuoteSuppliers.map((sId) => {
                          const isLowest =
                            Object.values(mockedQuotes).length > 0 &&
                            Object.values(mockedQuotes).every(
                              (q) => q.total >= mockedQuotes[sId].total,
                            )
                          return (
                            <TableCell
                              key={sId}
                              className={cn(
                                'text-right align-top py-4 border-b-2',
                                isLowest
                                  ? 'border-emerald-500 bg-emerald-50/50'
                                  : 'border-transparent',
                              )}
                            >
                              <div
                                className={cn(
                                  'text-lg font-bold',
                                  isLowest ? 'text-emerald-700' : 'text-foreground',
                                )}
                              >
                                {formatCurrency(mockedQuotes[sId]?.total || 0)}
                              </div>
                              {isLowest && (
                                <div className="text-xs font-semibold text-emerald-600 mb-2 mt-1 flex items-center justify-end gap-1">
                                  <Check className="h-3 w-3" /> Melhor Oferta
                                </div>
                              )}
                              {!isLowest && <div className="h-5 mb-2 mt-1" />}
                              <Button
                                size="sm"
                                className="w-full mt-2"
                                variant={isLowest ? 'default' : 'secondary'}
                                onClick={() => handleSelectWinner(sId)}
                              >
                                Selecionar
                              </Button>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-background shrink-0 flex-wrap gap-2">
            {quoteStep === 'select' ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsAutoQuoteOpen(false)
                    setIsOrderModalOpen(true)
                  }}
                >
                  <Printer className="w-4 h-4 mr-2" /> Impressão Direta do Pedido
                </Button>
                <div className="flex-1" />
                <Button variant="outline" onClick={() => setIsAutoQuoteOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerateQuotes}
                  disabled={selectedQuoteSuppliers.length === 0}
                >
                  Gerar Comparativo
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setQuoteStep('select')}>
                  Voltar
                </Button>
                <div className="flex-1" />
                <Button variant="outline" onClick={() => setIsAutoQuoteOpen(false)}>
                  Cancelar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 order-print-container bg-white">
          <DialogHeader className="p-6 border-b shrink-0 print:hidden">
            <DialogTitle>Imprimir Pedido de Compra</DialogTitle>
            <DialogDescription>
              Documento formatado para solicitar cotação ou enviar pedido aos fornecedores.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 flex-1 overflow-auto bg-white text-black">
            <div className="flex justify-between items-start border-b-2 border-gray-200 pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">PEDIDO DE COMPRA / COTAÇÃO</h2>
                <p className="text-sm text-gray-500 mt-1">ConstruMaster Materiais de Construção</p>
                <p className="text-sm text-gray-500">CNPJ: 12.345.678/0001-90</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  Data: {new Date().toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Ref: Solicitação de Reposição</p>
              </div>
            </div>

            <p className="text-sm mb-4">
              Aos cuidados do departamento comercial/vendas, solicitamos a cotação/pedido dos itens
              listados abaixo:
            </p>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left text-sm font-semibold">
                    Produto / Descrição
                  </th>
                  <th className="border p-2 text-left text-sm font-semibold">Marca/Ref</th>
                  <th className="border p-2 text-center text-sm font-semibold w-24">Qtd. Atual</th>
                  <th className="border p-2 text-center text-sm font-semibold w-24">
                    Qtd. Solicitada
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="border p-2 text-sm">
                      {p.name} <span className="text-xs text-gray-500 block">SKU: {p.sku}</span>
                    </td>
                    <td className="border p-2 text-sm">{p.brand || '-'}</td>
                    <td className="border p-2 text-sm text-center">{p.stock}</td>
                    <td className="border p-2 text-sm text-center font-bold">
                      {p.suggestedPurchase > 0 ? p.suggestedPurchase : p.targetStock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8 pt-4 border-t border-dashed text-sm text-gray-600">
              <p>Observações:</p>
              <ul className="list-disc pl-5 mt-2 text-xs">
                <li>Por favor, informar prazos de entrega e condições de pagamento na cotação.</li>
                <li>Valores sujeitos a aprovação da diretoria antes do faturamento.</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="p-4 border-t bg-background shrink-0 print:hidden flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsOrderModalOpen(false)}>
              Fechar
            </Button>
            <div className="flex gap-2 flex-1 justify-end">
              <Button
                variant="outline"
                onClick={sendOrderEmail}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Mail className="mr-2 h-4 w-4" /> E-mail
              </Button>
              <Button onClick={printOrder} className="bg-indigo-600 hover:bg-indigo-700">
                <Printer className="mr-2 h-4 w-4" /> PDF / Imprimir
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWhatsappModalOpen} onOpenChange={setIsWhatsappModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enviar via WhatsApp</DialogTitle>
            <DialogDescription>
              Selecione o fornecedor que receberá o pedido/cotação atual.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Fornecedor Cadastrado</Label>
              <Select value={whatsappSupplierId} onValueChange={setWhatsappSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {whatsappSupplierId !== 'none' && (
              <div className="bg-muted p-3 rounded-md text-sm border">
                <p>
                  <strong>Contato:</strong>{' '}
                  {suppliers.find((s) => s.id === whatsappSupplierId)?.contact || 'Não cadastrado'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Será aberta uma nova guia do WhatsApp Web/Desktop com a mensagem preenchida.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWhatsappModalOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={sendOrderWhatsapp}>
              <MessageCircle className="w-4 h-4 mr-2" /> Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewPurchaseOpen} onOpenChange={setIsNewPurchaseOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b shrink-0 bg-muted/10">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Registrar Entrada de Mercadoria
            </DialogTitle>
            <DialogDescription>
              Lance os produtos no estoque e gere as obrigações financeiras para o contas a pagar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x">
            <div className="flex-1 p-6 space-y-6 bg-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Filtrar Fornecedores por Categoria</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {allCategories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o Fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione...</SelectItem>
                      {filteredSuppliersForEntry.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Adicionar Produtos à Nota</Label>
                <Select onValueChange={addPurchaseItem} value="">
                  <SelectTrigger>
                    <SelectValue placeholder="Buscar produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - Estoque atual: {p.stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="border rounded-md mt-2">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-[100px] text-center">Qtd.</TableHead>
                        <TableHead className="w-[120px] text-right">Custo Un.</TableHead>
                        <TableHead className="w-[100px] text-right">Total</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseItems.map((item) => (
                        <TableRow key={item.product.id}>
                          <TableCell className="py-2">
                            <span className="text-sm font-medium">{item.product.name}</span>
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              type="number"
                              min="1"
                              className="h-8 w-full text-center px-1"
                              value={item.quantity}
                              onChange={(e) =>
                                updatePurchaseItem(
                                  item.product.id,
                                  'quantity',
                                  Number(e.target.value),
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-8 w-full text-right px-1"
                              value={item.costPrice}
                              onChange={(e) =>
                                updatePurchaseItem(
                                  item.product.id,
                                  'costPrice',
                                  Number(e.target.value),
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="py-2 text-right font-medium text-sm">
                            {formatCurrency(item.quantity * item.costPrice)}
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() =>
                                setPurchaseItems((c) =>
                                  c.filter((x) => x.product.id !== item.product.id),
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {purchaseItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            Nenhum produto adicionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[350px] p-6 bg-muted/10 flex flex-col gap-6">
              <div>
                <Label className="text-base font-semibold text-primary">
                  Detalhes Financeiros (Obrigatório)
                </Label>
                <p className="text-xs text-muted-foreground mt-1 mb-4 leading-tight">
                  Toda entrada de estoque gera uma obrigação no Contas a Pagar. Defina os
                  vencimentos abaixo.
                </p>

                <div className="flex justify-between items-center bg-white p-3 rounded-lg border mb-4">
                  <span className="font-semibold text-sm">Total da Compra</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(newPurchaseTotal)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Select
                      defaultValue="1"
                      onValueChange={(v) => handleGenerateInstallments(Number(v))}
                    >
                      <SelectTrigger className="flex-1 bg-white">
                        <SelectValue placeholder="Dividir em..." />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n}x parcelas
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 mt-4 max-h-[250px] overflow-y-auto pr-1">
                    {installments.map((inst, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2 items-center bg-white p-2 rounded border"
                      >
                        <div className="text-xs font-medium w-4 shrink-0 text-muted-foreground">
                          {idx + 1}
                        </div>
                        <Input
                          type="date"
                          className="h-8 px-2 flex-1 text-sm"
                          value={inst.dueDate}
                          onChange={(e) => {
                            const newInst = [...installments]
                            newInst[idx].dueDate = e.target.value
                            setInstallments(newInst)
                          }}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 w-24 text-right px-2 text-sm"
                          value={inst.amount}
                          onChange={(e) => {
                            const newInst = [...installments]
                            newInst[idx].amount = Number(e.target.value)
                            setInstallments(newInst)
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {installments.length > 0 &&
                    Math.abs(
                      newPurchaseTotal - installments.reduce((acc, curr) => acc + curr.amount, 0),
                    ) > 0.01 && (
                      <Alert variant="destructive" className="py-2 px-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-xs font-bold mb-0">Divergência</AlertTitle>
                        <AlertDescription className="text-[10px]">
                          A soma das parcelas (
                          {formatCurrency(installments.reduce((acc, curr) => acc + curr.amount, 0))}
                          ) difere do total.
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-background shrink-0">
            <Button variant="outline" onClick={() => setIsNewPurchaseOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePurchase} className="bg-primary hover:bg-primary/90">
              Confirmar Entrada e Gerar Contas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calc Modal */}
      <Dialog open={isCalcOpen} onOpenChange={setIsCalcOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Calculadora de Preço de Venda</DialogTitle>
            <DialogDescription>
              Defina a margem desejada para calcular o preço sugerido com base no último custo de
              reposição.
            </DialogDescription>
          </DialogHeader>
          {calcProduct && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col gap-1 border-b pb-3">
                <span className="text-sm text-muted-foreground">Produto</span>
                <span className="font-medium">{calcProduct.name}</span>
              </div>
              <div className="flex flex-col gap-1 border-b pb-3">
                <span className="text-sm text-muted-foreground">Custo de Reposição (R$)</span>
                <span className="font-medium">{formatCurrency(calcProduct.costPrice)}</span>
              </div>
              <div className="space-y-2">
                <Label>Margem de Lucro Desejada (%)</Label>
                <Input
                  type="number"
                  value={calcMargin}
                  onChange={(e) => setCalcMargin(Number(e.target.value))}
                  min="0"
                  max="99"
                />
                <p className="text-[10px] text-muted-foreground">
                  Fórmula: Preço Sugerido = Custo / (1 - Margem/100)
                </p>
              </div>
              <div className="flex justify-between items-center p-4 bg-primary/10 border border-primary/20 rounded-lg mt-4">
                <span className="font-semibold text-primary">Preço Sugerido</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(suggestedPrice)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalcOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={applySuggestedPrice}>Aplicar Novo Preço</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
