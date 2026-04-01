import { useMemo, useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppContext, Product } from '@/context/AppContext'
import { exportSalesToExcel, formatCurrency } from '@/lib/utils'
import { PrintableSales } from '@/components/PrintableSales'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { startOfDay, subDays, startOfMonth, endOfDay } from 'date-fns'

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export default function Reports() {
  const { sales, sellerCreditHistory, role } = useAppContext()

  if (role !== 'Admin' && role !== 'Manager') {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
        <p className="text-muted-foreground">
          Você não tem permissão para visualizar relatórios gerenciais.
        </p>
      </div>
    )
  }

  const [perfPeriod, setPerfPeriod] = useState('month') // today, week, month, custom
  const [perfCustomStart, setPerfCustomStart] = useState('')
  const [perfCustomEnd, setPerfCustomEnd] = useState('')

  const [marginPeriod, setMarginPeriod] = useState('month')
  const [marginCustomStart, setMarginCustomStart] = useState('')
  const [marginCustomEnd, setMarginCustomEnd] = useState('')

  const abcData = useMemo(() => {
    const productTotals = new Map<string, { product: Product; total: number; qty: number }>()

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productTotals.get(item.product.id)
        if (existing) {
          existing.total += item.total
          existing.qty += item.quantity
        } else {
          productTotals.set(item.product.id, {
            product: item.product,
            total: item.total,
            qty: item.quantity,
          })
        }
      })
    })

    const sorted = Array.from(productTotals.values()).sort((a, b) => b.total - a.total)
    const grandTotal = sorted.reduce((acc, curr) => acc + curr.total, 0) || 1

    let cumulative = 0
    return sorted.map((item) => {
      cumulative += item.total
      const cumulativePercent = (cumulative / grandTotal) * 100
      let classification = 'C'
      if (cumulativePercent <= 80) classification = 'A'
      else if (cumulativePercent <= 95) classification = 'B'

      return {
        ...item,
        percentage: (item.total / grandTotal) * 100,
        cumulativePercent,
        classification,
      }
    })
  }, [sales])

  const filteredPerfSales = useMemo(() => {
    let start = new Date(0)
    let end = new Date()
    const now = new Date()

    if (perfPeriod === 'today') {
      start = startOfDay(now)
    } else if (perfPeriod === 'week') {
      start = subDays(now, 7)
    } else if (perfPeriod === 'month') {
      start = startOfMonth(now)
    } else if (perfPeriod === 'custom') {
      start = perfCustomStart ? new Date(perfCustomStart + 'T00:00:00') : new Date(0)
      end = perfCustomEnd ? new Date(perfCustomEnd + 'T23:59:59') : new Date()
    }

    return sales.filter((s) => {
      const d = new Date(s.date)
      return d >= start && d <= end && s.status !== 'Cancelado'
    })
  }, [sales, perfPeriod, perfCustomStart, perfCustomEnd])

  const perfMetrics = useMemo(() => {
    let revenue = 0
    let cost = 0
    const productMap = new Map<string, { name: string; qty: number; rev: number }>()

    filteredPerfSales.forEach((s) => {
      s.items.forEach((item) => {
        revenue += item.total
        cost += item.quantity * (item.product.costPrice || 0)

        const ex = productMap.get(item.product.id)
        if (ex) {
          ex.qty += item.quantity
          ex.rev += item.total
        } else {
          productMap.set(item.product.id, {
            name: item.product.name,
            qty: item.quantity,
            rev: item.total,
          })
        }
      })
    })

    const profit = revenue - cost
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    return { revenue, cost, profit, margin, topProducts }
  }, [filteredPerfSales])

  const marginMetrics = useMemo(() => {
    let start = new Date(0)
    let end = new Date()
    const now = new Date()

    if (marginPeriod === 'today') {
      start = startOfDay(now)
      end = endOfDay(now)
    } else if (marginPeriod === 'week') {
      start = startOfDay(subDays(now, 7))
      end = endOfDay(now)
    } else if (marginPeriod === 'month') {
      start = startOfDay(startOfMonth(now))
      end = endOfDay(now)
    } else if (marginPeriod === 'custom') {
      start = marginCustomStart ? new Date(marginCustomStart + 'T00:00:00') : new Date(0)
      end = marginCustomEnd ? new Date(marginCustomEnd + 'T23:59:59') : new Date()
    }

    const filteredHistory = sellerCreditHistory.filter((h) => {
      const d = new Date(h.createdAt)
      return d >= start && d <= end
    })

    const lostProfit = filteredHistory
      .filter((h) => h.type === 'debito')
      .reduce((acc, curr) => acc + Math.abs(curr.value), 0)

    const recoveredProfit = filteredHistory
      .filter((h) => h.type === 'credito')
      .reduce((acc, curr) => acc + curr.value, 0)

    return { lostProfit, recoveredProfit }
  }, [sellerCreditHistory, marginPeriod, marginCustomStart, marginCustomEnd])

  const marginChartData = [
    {
      name: 'Resultado',
      'Lucro Recuperado': marginMetrics.recoveredProfit,
      'Lucro Potencial Perdido': marginMetrics.lostProfit,
    },
  ]

  const marginCategoryData = useMemo(() => {
    const catMap = new Map<string, { revenue: number; cost: number; profit: number }>()

    filteredPerfSales.forEach((s) => {
      s.items.forEach((item) => {
        const cat = item.product.category || 'Geral'
        const rev = item.total
        const cst = item.quantity * (item.product.costPrice || 0)
        const prof = rev - cst

        const ex = catMap.get(cat)
        if (ex) {
          ex.revenue += rev
          ex.cost += cst
          ex.profit += prof
        } else {
          catMap.set(cat, { revenue: rev, cost: cst, profit: prof })
        }
      })
    })

    return Array.from(catMap.entries())
      .map(([category, data]) => {
        const margin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0
        return { category, ...data, margin }
      })
      .sort((a, b) => b.margin - a.margin)
  }, [filteredPerfSales])

  const top5Profitable = marginCategoryData.slice(0, 5)
  const bottom5Profitable = [...marginCategoryData].sort((a, b) => a.margin - b.margin).slice(0, 5)

  const chartData = [
    { month: 'Jan', vendas: 45000, custos: 32000 },
    { month: 'Fev', vendas: 52000, custos: 34000 },
    { month: 'Mar', vendas: 48000, custos: 31000 },
    { month: 'Abr', vendas: 61000, custos: 38000 },
    { month: 'Mai', vendas: 59000, custos: 36000 },
    { month: 'Jun', vendas: 75000, custos: 45000 },
  ]

  const chartConfig = {
    vendas: { label: 'Faturamento', color: 'hsl(var(--primary))' },
    custos: { label: 'Custos', color: 'hsl(var(--muted-foreground))' },
  }

  const categoryData = [
    { category: 'Básico', value: 45 },
    { category: 'Hidráulica', value: 25 },
    { category: 'Elétrica', value: 20 },
    { category: 'Pintura', value: 10 },
  ]

  const catConfig = {
    value: { label: 'Vendas %', color: 'hsl(var(--primary))' },
  }

  const pieConfig = {
    qty: { label: 'Quantidade Vendida' },
  }

  return (
    <Tabs defaultValue="geral" className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios de Desempenho</h1>
          <p className="text-muted-foreground">Análise gráfica das vendas e saúde financeira.</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="geral">Geral Financeiro</TabsTrigger>
            <TabsTrigger value="performance">Desempenho (Lucro)</TabsTrigger>
            <TabsTrigger value="abc">Curva ABC</TabsTrigger>
            <TabsTrigger value="margens">Margens e Créditos</TabsTrigger>
            <TabsTrigger value="margens-categoria">Dashboard de Margens</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportSalesToExcel(sales)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
      </div>

      <TabsContent value="geral" className="grid gap-6 md:grid-cols-2 mt-0 print:hidden">
        <Card>
          <CardHeader>
            <CardTitle>Faturamento vs Custos (1S)</CardTitle>
            <CardDescription>Evolução mensal financeira.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `R$${val / 1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="vendas"
                    stroke="var(--color-vendas)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="custos"
                    stroke="var(--color-custos)"
                    strokeWidth={3}
                    dot={false}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por Categoria</CardTitle>
            <CardDescription>Distribuição percentual por grupo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={catConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: 30, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis type="number" hide />
                  <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    radius={[0, 4, 4, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="performance" className="mt-0 print:hidden flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end mb-4 bg-muted/20 p-4 rounded-lg border">
          <div className="space-y-1.5 w-full sm:w-48">
            <Label>Período de Análise</Label>
            <Select value={perfPeriod} onValueChange={setPerfPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Mês Atual</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {perfPeriod === 'custom' && (
            <>
              <div className="space-y-1.5 w-full sm:w-auto">
                <Label>Início</Label>
                <Input
                  type="date"
                  value={perfCustomStart}
                  onChange={(e) => setPerfCustomStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 w-full sm:w-auto">
                <Label>Fim</Label>
                <Input
                  type="date"
                  value={perfCustomEnd}
                  onChange={(e) => setPerfCustomEnd(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(perfMetrics.revenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Custo (CMV)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(perfMetrics.cost)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Lucro Bruto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(perfMetrics.profit)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Margem Média (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {perfMetrics.margin.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Top Produtos (Qtd Vendida)</CardTitle>
              <CardDescription>Produtos mais vendidos no período.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {perfMetrics.topProducts.length > 0 ? (
                <ChartContainer config={pieConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={perfMetrics.topProducts}
                        dataKey="qty"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {perfMetrics.topProducts.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível.
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Detalhamento Top Produtos</CardTitle>
              <CardDescription>Receita gerada pelos campeões de venda.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Produto</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right pr-6">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perfMetrics.topProducts.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="pl-6 font-medium">{p.name}</TableCell>
                      <TableCell className="text-center">{p.qty}</TableCell>
                      <TableCell className="text-right pr-6 font-bold">
                        {formatCurrency(p.rev)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {perfMetrics.topProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Nenhuma venda encontrada no período selecionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="abc" className="mt-0 print:hidden flex-1">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Curva ABC de Produtos</CardTitle>
            <CardDescription>
              Classificação baseada no faturamento histórico (A: até 80%, B: até 95%, C: restantes).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Produto / SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Qtd Vendida</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-center">% Acumulado</TableHead>
                  <TableHead className="text-center pr-6">Curva</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abcData.map((item) => (
                  <TableRow key={item.product.id}>
                    <TableCell className="pl-6">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                    </TableCell>
                    <TableCell>{item.product.category}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {item.cumulativePercent.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center pr-6">
                      <Badge
                        variant={
                          item.classification === 'A'
                            ? 'default'
                            : item.classification === 'B'
                              ? 'secondary'
                              : 'outline'
                        }
                        className={
                          item.classification === 'A' ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                        }
                      >
                        {item.classification}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {abcData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum dado de venda disponível.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="margens" className="mt-0 print:hidden flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end mb-4 bg-muted/20 p-4 rounded-lg border">
          <div className="space-y-1.5 w-full sm:w-48">
            <Label>Período de Análise</Label>
            <Select value={marginPeriod} onValueChange={setMarginPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Mês Atual</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {marginPeriod === 'custom' && (
            <>
              <div className="space-y-1.5 w-full sm:w-auto">
                <Label>Início</Label>
                <Input
                  type="date"
                  value={marginCustomStart}
                  onChange={(e) => setMarginCustomStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 w-full sm:w-auto">
                <Label>Fim</Label>
                <Input
                  type="date"
                  value={marginCustomEnd}
                  onChange={(e) => setMarginCustomEnd(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-emerald-200">
            <CardHeader className="bg-emerald-50/50 pb-2">
              <CardTitle className="text-emerald-700 text-sm">Lucro Recuperado</CardTitle>
              <CardDescription>
                Soma de todos os prêmios/acréscimos aplicados nas vendas.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-emerald-600">
                {formatCurrency(marginMetrics.recoveredProfit)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardHeader className="bg-red-50/50 pb-2">
              <CardTitle className="text-red-700 text-sm">Lucro Potencial Perdido</CardTitle>
              <CardDescription>Soma de todos os descontos concedidos nas vendas.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(marginMetrics.lostProfit)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Comparativo de Margens</CardTitle>
            <CardDescription>Visão geral de recuperação vs perdas no período.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                'Lucro Recuperado': { label: 'Recuperado', color: 'hsl(var(--emerald-500))' },
                'Lucro Potencial Perdido': { label: 'Perdido', color: 'hsl(var(--red-500))' },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={marginChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => `R$${val / 1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="Lucro Recuperado"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={100}
                  />
                  <Bar
                    dataKey="Lucro Potencial Perdido"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={100}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="margens-categoria" className="mt-0 print:hidden flex-1 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Margem de Lucro por Categoria (%)</CardTitle>
              <CardDescription>
                Comparativo do Custo Real x Preço de Venda nas categorias vendidas.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {marginCategoryData.length > 0 ? (
                <ChartContainer
                  config={{
                    margin: { label: 'Margem %', color: 'hsl(var(--primary))' },
                  }}
                  className="h-[400px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={marginCategoryData}
                      layout="vertical"
                      margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(val) => `${val}%`} />
                      <YAxis dataKey="category" type="category" width={100} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="margin" fill="var(--color-margin)" radius={[0, 4, 4, 0]}>
                        {marginCategoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.margin >= 20
                                ? '#10b981'
                                : entry.margin >= 10
                                  ? '#f59e0b'
                                  : '#ef4444'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-emerald-700">Top 5 Mais Lucrativos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {top5Profitable.map((c) => (
                      <TableRow key={`top-${c.category}`}>
                        <TableCell className="font-medium">{c.category}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-bold">
                          {c.margin.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(c.profit)}</TableCell>
                      </TableRow>
                    ))}
                    {top5Profitable.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                          Nenhuma categoria vendida.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-red-700">Top 5 Menos Lucrativos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bottom5Profitable.map((c) => (
                      <TableRow key={`bot-${c.category}`}>
                        <TableCell className="font-medium">{c.category}</TableCell>
                        <TableCell className="text-right text-red-600 font-bold">
                          {c.margin.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(c.profit)}</TableCell>
                      </TableRow>
                    ))}
                    {bottom5Profitable.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                          Nenhuma categoria vendida.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <PrintableSales sales={sales} />
    </Tabs>
  )
}
