import { useMemo } from 'react'
import { useAppContext } from '@/context/AppContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { startOfMonth, endOfMonth, format, subMonths, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function CashFlow() {
  const { sales, payables } = useAppContext()

  const chartData = useMemo(() => {
    const data = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const start = startOfMonth(monthDate)
      const end = endOfMonth(monthDate)

      const monthSales = sales.filter((s) => isWithinInterval(new Date(s.date), { start, end }))
      const monthReceivables = monthSales.reduce((acc, s) => acc + s.total, 0)

      const monthPayables = payables.filter((p) =>
        isWithinInterval(new Date(p.dueDate), { start, end }),
      )
      const monthPayablesTotal = monthPayables.reduce((acc, p) => acc + p.amount, 0)

      data.push({
        month: format(monthDate, 'MMM/yy', { locale: ptBR }),
        receitas: monthReceivables,
        despesas: monthPayablesTotal,
        saldo: monthReceivables - monthPayablesTotal,
      })
    }
    return data
  }, [sales, payables])

  const totalReceivables = chartData.reduce((acc, curr) => acc + curr.receitas, 0)
  const totalPayables = chartData.reduce((acc, curr) => acc + curr.despesas, 0)
  const projectedBalance = totalReceivables - totalPayables

  const chartConfig = {
    receitas: { label: 'Receitas (Vendas)', color: '#10b981' },
    despesas: { label: 'Despesas (Compras)', color: '#ef4444' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fluxo de Caixa</h1>
        <p className="text-muted-foreground">
          Visão consolidada de entradas e saídas financeiras do negócio.
        </p>
      </div>

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
              {formatCurrency(totalReceivables)}
            </div>
            <p className="text-xs text-emerald-600/80">Baseado em vendas (6 meses)</p>
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
              {formatCurrency(totalPayables)}
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
              className={cn('h-4 w-4', projectedBalance >= 0 ? 'text-primary' : 'text-orange-600')}
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

      <Card>
        <CardHeader>
          <CardTitle>Comparativo Mensal</CardTitle>
          <CardDescription>Receitas vs Despesas ao longo dos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `R$${val / 1000}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="receitas" fill="var(--color-receitas)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="var(--color-despesas)" radius={[4, 4, 0, 0]} />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
