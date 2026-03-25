import { useState, useMemo } from 'react'
import { useAppContext } from '@/context/AppContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react'
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'

type Method = 'Dinheiro' | 'Cartão' | 'Pix'

type Transaction = {
  id: string
  amount: number
  method: Method
  timestamp: string
}

export default function CashFlow() {
  const { sales, payables } = useAppContext()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<Method>('Dinheiro')

  const chartDataSummary = useMemo(() => {
    const now = new Date()
    let receitas = 0
    let despesas = 0

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const start = startOfMonth(monthDate)
      const end = endOfMonth(monthDate)

      const monthSales = sales.filter((s) => isWithinInterval(new Date(s.date), { start, end }))
      receitas += monthSales.reduce((acc, s) => acc + s.total, 0)

      const monthPayables = payables.filter((p) =>
        isWithinInterval(new Date(p.dueDate), { start, end }),
      )
      despesas += monthPayables.reduce((acc, p) => acc + p.amount, 0)
    }
    return { receitas, despesas }
  }, [sales, payables])

  const sessionTotal = transactions.reduce((acc, t) => acc + t.amount, 0)
  const totalReceivables = chartDataSummary.receitas + sessionTotal
  const totalPayables = chartDataSummary.despesas
  const projectedBalance = totalReceivables - totalPayables

  const handleRegisterSale = () => {
    const numAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Valor inválido',
        description: 'Por favor, insira um valor maior que zero.',
      })
      return
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount: numAmount,
      method,
      timestamp: new Date().toISOString(),
    }

    setTransactions([newTransaction, ...transactions])
    setAmount('')
    toast({
      title: 'Venda Registrada',
      description: `A venda de ${formatCurrency(numAmount)} no ${method} foi registrada com sucesso.`,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fluxo de Caixa / Caixa Diário</h1>
        <p className="text-muted-foreground">
          Controle sua receita diária e registre entradas avulsas de vendas.
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
            <p className="text-xs text-emerald-600/80">Baseado em vendas e entradas diárias</p>
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Venda (Caixa)</CardTitle>
            <CardDescription>
              Insira o valor e a forma de pagamento para registrar uma venda rápida no caixa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor da Venda (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Tabs value={method} onValueChange={(v) => setMethod(v as Method)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="Dinheiro">Dinheiro</TabsTrigger>
                  <TabsTrigger value="Cartão">Cartão</TabsTrigger>
                  <TabsTrigger value="Pix">Pix</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Button className="w-full mt-4" onClick={handleRegisterSale}>
              Registrar Venda
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full min-h-[300px]">
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
            <CardDescription>Vendas registradas nesta sessão.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[300px] w-full px-6 pb-6">
              {transactions.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  Nenhuma venda registrada nesta sessão.
                </div>
              ) : (
                <div className="space-y-4 pr-4">
                  {transactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex justify-between items-center border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-sm text-foreground">{t.method}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          t.method === 'Pix'
                            ? 'default'
                            : t.method === 'Dinheiro'
                              ? 'secondary'
                              : 'outline'
                        }
                        className={cn(
                          'text-sm font-bold',
                          t.method === 'Pix' && 'bg-emerald-500 hover:bg-emerald-600',
                        )}
                      >
                        {formatCurrency(t.amount)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
