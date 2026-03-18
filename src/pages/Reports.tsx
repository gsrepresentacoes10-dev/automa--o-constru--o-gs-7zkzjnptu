import { useMemo } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppContext, Product } from '@/context/AppContext'
import { exportSalesToExcel, formatCurrency } from '@/lib/utils'
import { PrintableSales } from '@/components/PrintableSales'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
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
} from 'recharts'

export default function Reports() {
  const { sales } = useAppContext()

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

  return (
    <Tabs defaultValue="geral" className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios de Desempenho</h1>
          <p className="text-muted-foreground">Análise gráfica das vendas e saúde financeira.</p>
        </div>
        <div className="flex items-center gap-4">
          <TabsList>
            <TabsTrigger value="geral">Geral Financeiro</TabsTrigger>
            <TabsTrigger value="abc">Curva ABC</TabsTrigger>
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

      <PrintableSales sales={sales} />
    </Tabs>
  )
}
