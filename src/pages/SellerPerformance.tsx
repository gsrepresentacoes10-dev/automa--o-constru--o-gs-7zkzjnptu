import { useState, useMemo } from 'react'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, Target, Award, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function SellerPerformance() {
  const { sales, users, sellerCreditHistory, sellers } = useAppContext()
  const [period, setPeriod] = useState('month') // today, 7days, month, all

  const filteredSales = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return sales.filter((s) => {
      const saleDate = new Date(s.date)
      if (period === 'today') return saleDate >= today
      if (period === '7days') return saleDate >= sevenDaysAgo
      if (period === 'month') return saleDate >= startOfMonth
      return true
    })
  }, [sales, period])

  const sellerStats = useMemo(() => {
    const stats: Record<string, { id: string; name: string; revenue: number; count: number }> = {}

    // Initialize active sellers
    users.forEach((u) => {
      if (u.role === 'Seller' || u.role === 'Admin') {
        stats[u.id] = { id: u.id, name: u.name, revenue: 0, count: 0 }
      }
    })

    filteredSales.forEach((s) => {
      const sId = s.sellerId || 'unknown'
      if (!stats[sId]) {
        stats[sId] = { id: sId, name: s.sellerName || 'Desconhecido', revenue: 0, count: 0 }
      }
      stats[sId].revenue += s.total
      stats[sId].count += 1
    })

    const result = Object.values(stats)
      .filter((s) => s.count > 0 || users.some((u) => u.id === s.id && u.role === 'Seller'))
      .map((s) => ({
        ...s,
        avgTicket: s.count > 0 ? s.revenue / s.count : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    return result
  }, [filteredSales, users])

  const creditRanking = useMemo(() => {
    const now = new Date()
    let start = new Date(0)
    let end = new Date()

    if (period === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === '7days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const filteredCredits = sellerCreditHistory.filter((h) => {
      const d = new Date(h.createdAt)
      return h.type === 'credito' && d >= start && d <= end
    })

    const stats: Record<string, { id: string; name: string; code: string; totalCredit: number }> =
      {}

    sellers.forEach((s) => {
      stats[s.id] = { id: s.id, name: s.name, code: s.code, totalCredit: 0 }
    })

    filteredCredits.forEach((c) => {
      if (stats[c.sellerId]) {
        stats[c.sellerId].totalCredit += c.value
      }
    })

    return Object.values(stats)
      .filter((s) => s.totalCredit > 0)
      .sort((a, b) => b.totalCredit - a.totalCredit)
  }, [sellerCreditHistory, sellers, period])

  const totalRevenue = sellerStats.reduce((acc, curr) => acc + curr.revenue, 0)
  const totalSalesCount = sellerStats.reduce((acc, curr) => acc + curr.count, 0)

  const chartConfig = {
    revenue: { label: 'Faturamento', color: 'hsl(var(--primary))' },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Desempenho da Equipe</h1>
          <p className="text-muted-foreground">
            Avalie a produtividade e faturamento dos colaboradores.
          </p>
        </div>
        <div className="w-full sm:w-48">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Mês Atual</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Concluídas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesCount}</div>
            <p className="text-xs text-muted-foreground">Pedidos finalizados no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento da Equipe</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Receita total gerada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sellerStats.filter((s) => s.count > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Com pelo menos 1 venda</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Faturamento</CardTitle>
            <CardDescription>Comparativo de receita gerada por vendedor.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sellerStats}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(val) => `R$${val / 1000}k`} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-revenue)"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Detalhamento por Colaborador</CardTitle>
            <CardDescription>Métricas individuais de eficiência.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Colaborador</TableHead>
                  <TableHead className="text-center">Qtd. Vendas</TableHead>
                  <TableHead className="text-right">Ticket Médio</TableHead>
                  <TableHead className="text-right pr-6">Faturamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerStats.map((seller, index) => (
                  <TableRow key={seller.id}>
                    <TableCell className="pl-6 font-medium flex items-center gap-2">
                      {index === 0 && seller.count > 0 && (
                        <Award className="h-4 w-4 text-amber-500" />
                      )}
                      {seller.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{seller.count}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(seller.avgTicket)}
                    </TableCell>
                    <TableCell className="text-right font-bold pr-6">
                      {formatCurrency(seller.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
                {sellerStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum dado encontrado para o período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold tracking-tight mt-6 mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" /> Ranking de Créditos (Recuperação de Margem)
        </h2>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Top Colaboradores</CardTitle>
            <CardDescription>
              Classificação baseada em créditos gerados através de vendas acima do preço base no
              período selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Pos</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead className="text-right pr-6">Créditos Gerados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditRanking.map((seller, index) => (
                  <TableRow key={seller.id}>
                    <TableCell className="text-center font-bold">{index + 1}º</TableCell>
                    <TableCell className="font-medium">
                      {seller.name}{' '}
                      <span className="text-muted-foreground text-xs ml-1">({seller.code})</span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 pr-6">
                      +{formatCurrency(seller.totalCredit)}
                    </TableCell>
                  </TableRow>
                ))}
                {creditRanking.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Nenhum crédito gerado no período selecionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
