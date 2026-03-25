import { Navigate } from 'react-router-dom'
import { useAppContext } from '@/context/AppContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
  DollarSign,
  ShoppingCart,
  Landmark,
  PackageOpen,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { subDays, subWeeks, subMonths, format, startOfWeek, isSameMonth } from 'date-fns'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

export default function Index() {
  const { products, sales, quotes, role, payables } = useAppContext()

  if (role === 'Seller') {
    return <Navigate to="/vendas" replace />
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overduePayables = payables.filter(
    (p) => p.status === 'Pendente' && new Date(p.dueDate) < today,
  )
  const dueTodayPayables = payables.filter(
    (p) => p.status === 'Pendente' && new Date(p.dueDate).getTime() === today.getTime(),
  )

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock)

  const totalRevenue = sales.reduce((acc, curr) => acc + curr.total, 0)
  const pendingReceivables = sales
    .filter((s) => s.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.total, 0)
  const salesCount = sales.length

  const pendingQuotes = quotes.filter((q) => q.status === 'Pendente').length
  const approvedQuotes = quotes.filter((q) => q.status === 'Aprovado').length
  const rejectedQuotes = quotes.filter((q) => q.status === 'Reprovado').length
  const convertedQuotes = quotes.filter((q) => q.status === 'Convertido').length

  const dailyData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i)
    const daySales = sales.filter(
      (s) => format(new Date(s.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'),
    )
    return {
      label: format(date, 'dd/MM'),
      faturamento: daySales.reduce((acc, s) => acc + s.total, 0),
    }
  })

  const weeklyData = Array.from({ length: 4 }).map((_, i) => {
    const start = startOfWeek(subWeeks(new Date(), 3 - i))
    const end = startOfWeek(subWeeks(new Date(), 2 - i))
    const weekSales = sales.filter((s) => {
      const sd = new Date(s.date)
      return sd >= start && sd < end
    })
    return {
      label: format(start, 'dd/MM'),
      faturamento: weekSales.reduce((acc, s) => acc + s.total, 0),
    }
  })

  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), 5 - i)
    const monthSales = sales.filter((s) => isSameMonth(new Date(s.date), date))
    return {
      label: format(date, 'MMM/yy'),
      faturamento: monthSales.reduce((acc, s) => acc + s.total, 0),
    }
  })

  return (
    <div className="space-y-6">
      {(overduePayables.length > 0 || dueTodayPayables.length > 0) && (
        <div className="flex flex-col gap-2">
          {overduePayables.length > 0 && (
            <Alert
              variant="destructive"
              className="bg-destructive/10 border-destructive/20 text-destructive"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção: Contas Atrasadas</AlertTitle>
              <AlertDescription>
                Você possui {overduePayables.length} conta(s) a pagar que já passaram do vencimento.
              </AlertDescription>
            </Alert>
          )}
          {dueTodayPayables.length > 0 && (
            <Alert className="bg-amber-50 border-amber-200 text-amber-800 [&>svg]:text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Avisos de Vencimento</AlertTitle>
              <AlertDescription>
                Você possui {dueTodayPayables.length} conta(s) a pagar com vencimento para hoje.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Intelligence</h1>
        <p className="text-muted-foreground">
          Visão geral do desempenho e saúde financeira do negócio.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Toda a base registrada</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Realizadas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesCount}</div>
            <p className="text-xs text-muted-foreground">Pedidos finalizados</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Recebíveis Pendentes
            </CardTitle>
            <Landmark className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(pendingReceivables)}
            </div>
            <p className="text-xs text-muted-foreground">Referente a Vendas a Prazo</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-bold tracking-tight mb-4 mt-2">Status de Orçamentos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingQuotes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600">Aprovados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{approvedQuotes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Reprovados</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{rejectedQuotes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Convertidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{convertedQuotes}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Faturamento Semanal</CardTitle>
            <CardDescription>Receita gerada nos últimos 7 dias.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ faturamento: { label: 'Faturamento', color: 'hsl(var(--primary))' } }}
              className="h-[250px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `R$${val / 1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="faturamento"
                    fill="var(--color-faturamento)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 shadow-sm flex flex-col">
          <CardHeader className="pb-3 bg-destructive/5">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <PackageOpen className="h-5 w-5" /> Alertas de Estoque
            </CardTitle>
            <CardDescription>Itens abaixo do mínimo.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-[250px] p-4">
              <div className="space-y-3">
                {lowStockProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Todos os estoques estão normais.</p>
                ) : (
                  lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center bg-muted/30 p-2 rounded-md border border-destructive/10"
                    >
                      <div>
                        <p className="font-medium text-sm leading-tight">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">SKU: {p.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-destructive">
                          {p.stock} {p.unit}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Mín: {p.minStock}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tendência Mensal (4 Semanas)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ faturamento: { label: 'Faturamento', color: 'hsl(var(--chart-2))' } }}
              className="h-[220px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `R$${val / 1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="faturamento"
                    stroke="var(--color-faturamento)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Histórico Semestral (6 Meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ faturamento: { label: 'Faturamento', color: 'hsl(var(--chart-3))' } }}
              className="h-[220px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `R$${val / 1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="faturamento"
                    fill="var(--color-faturamento)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
