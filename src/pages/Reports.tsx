import { BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  const chartData = [
    { month: 'Jan', vendas: 45000, custos: 32000 },
    { month: 'Fev', vendas: 52000, custos: 34000 },
    { month: 'Mar', vendas: 48000, custos: 31000 },
    { month: 'Abr', vendas: 61000, custos: 38000 },
    { month: 'Mai', vendas: 59000, custos: 36000 },
    { month: 'Jun', vendas: 75000, custos: 45000 },
  ]

  const chartConfig = {
    vendas: {
      label: 'Faturamento',
      color: 'hsl(var(--primary))',
    },
    custos: {
      label: 'Custos',
      color: 'hsl(var(--muted-foreground))',
    },
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios de Desempenho</h1>
        <p className="text-muted-foreground">Análise gráfica das vendas e saúde financeira.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Faturamento vs Custos (1S 2024)</CardTitle>
            <CardDescription>
              Evolução mensal do faturamento bruto e custos de mercadoria.
            </CardDescription>
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
            <CardDescription>Distribuição percentual por grupo de produtos.</CardDescription>
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
      </div>
    </div>
  )
}
