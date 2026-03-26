import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext, Sale } from '@/context/AppContext'
import { formatCurrency, cn } from '@/lib/utils'
import { Search, CalendarDays, Printer, MoreHorizontal, Copy, Ban, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'

export default function SalesSearch() {
  const navigate = useNavigate()
  const { sales, cancelSale, logSaleAction, currentUser } = useAppContext()
  const [orderNumber, setOrderNumber] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null)
  const [cancelReason, setCancelReason] = useState<string>('')
  const [returnToStock, setReturnToStock] = useState<boolean>(true)
  const [detailsSale, setDetailsSale] = useState<Sale | null>(null)

  const handleSearch = () => {
    let filtered = sales

    if (orderNumber.trim()) {
      filtered = filtered.filter((s) =>
        s.id.toLowerCase().includes(orderNumber.toLowerCase().trim()),
      )
    }

    if (dateFrom) {
      const from = new Date(dateFrom + 'T00:00:00')
      filtered = filtered.filter((s) => new Date(s.date) >= from)
    }

    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59')
      filtered = filtered.filter((s) => new Date(s.date) <= to)
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter((s) => s.status !== 'Cancelado')
    } else if (statusFilter === 'cancelled') {
      filtered = filtered.filter((s) => s.status === 'Cancelado')
    }

    setFilteredSales(
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    )
    setHasSearched(true)
  }

  useEffect(() => {
    if (hasSearched) {
      handleSearch()
    }
  }, [statusFilter, sales])

  const handleClone = (sale: Sale) => {
    logSaleAction(sale.id, 'Clonagem para re-faturamento')
    navigate('/vendas', { state: { cloneSale: sale } })
  }

  const handleCancelConfirm = () => {
    if (saleToCancel && cancelReason) {
      cancelSale(saleToCancel.id, cancelReason, returnToStock)
      setSaleToCancel(null)
      setCancelReason('')
      setReturnToStock(true)
    }
  }

  const totalSalesAmount = useMemo(() => {
    return filteredSales.reduce(
      (acc, sale) => acc + (sale.status !== 'Cancelado' ? sale.total : 0),
      0,
    )
  }, [filteredSales])

  const performanceData = useMemo(() => {
    const active = filteredSales
      .filter((s) => s.status !== 'Cancelado')
      .reduce((acc, s) => acc + s.total, 0)
    const cancelled = filteredSales
      .filter((s) => s.status === 'Cancelado')
      .reduce((acc, s) => acc + s.total, 0)
    return [
      { status: 'Efetivadas', total: active, fill: 'hsl(var(--primary))' },
      { status: 'Canceladas', total: cancelled, fill: 'hsl(var(--destructive))' },
    ]
  }, [filteredSales])

  const handlePrint = () => {
    window.print()
  }

  const periodLabel = useMemo(() => {
    if (orderNumber && !dateFrom && !dateTo) return `Busca: ${orderNumber}`
    if (!dateFrom && !dateTo) return 'Todo o período'
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início'
    const to = dateTo ? new Date(dateTo + 'T23:59:59').toLocaleDateString('pt-BR') : 'Hoje'
    return `${from} a ${to}`
  }, [dateFrom, dateTo, orderNumber])

  const hasPhysicalProducts = useMemo(() => {
    if (!saleToCancel) return false
    return saleToCancel.items.some(
      (item) => !item.product.category.toLowerCase().includes('serviço'),
    )
  }, [saleToCancel])

  return (
    <>
      <div className="space-y-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesquisa de Vendas</h1>
          <p className="text-muted-foreground">
            Filtre o histórico de vendas definindo um período ou número de pedido específico.
          </p>
        </div>

        <Card>
          <div className="p-4 border-b bg-muted/20 flex flex-col lg:flex-row gap-4 items-end">
            <div className="space-y-1.5 w-full lg:w-auto flex-1 max-w-[200px]">
              <Label>Número do Pedido</Label>
              <Input
                placeholder="Ex: V-1001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-1.5 w-full lg:w-auto flex-1 max-w-[200px]">
              <Label>Data Início</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5 w-full lg:w-auto flex-1 max-w-[200px]">
              <Label>Data Fim</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-1.5 w-full lg:w-auto flex-1 max-w-[200px]">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Ativas (Pagas/Pendentes)</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 w-full lg:w-auto">
              <Button onClick={handleSearch} className="flex-1 lg:flex-none">
                <Search className="mr-2 h-4 w-4" /> Pesquisar
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={!hasSearched || filteredSales.length === 0}
                className="flex-1 lg:flex-none"
              >
                <Printer className="mr-2 h-4 w-4" /> Imprimir
              </Button>
            </div>
          </div>
        </Card>

        {hasSearched && (
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="md:col-span-1 border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Resumo do Filtro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totalSalesAmount)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total em Vendas ({filteredSales.filter((s) => s.status !== 'Cancelado').length}{' '}
                  transações válidas)
                </p>
              </CardContent>
            </Card>

            {filteredSales.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Desempenho: Efetivadas vs Canceladas
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[120px] pb-0">
                  <ChartContainer
                    config={{ total: { label: 'Total (R$)' } }}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={performanceData}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="status"
                          type="category"
                          width={80}
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                          }
                        />
                        <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={24}>
                          {performanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Data / Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right pr-6 w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hasSearched ? (
                  filteredSales.length > 0 ? (
                    filteredSales.map((sale) => (
                      <TableRow
                        key={sale.id}
                        className={sale.status === 'Cancelado' ? 'opacity-60 bg-muted/50' : ''}
                      >
                        <TableCell className="pl-6">
                          <div className="font-medium">
                            {new Date(sale.date).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-muted-foreground">{sale.id}</div>
                        </TableCell>
                        <TableCell>{sale.customer || 'Consumidor Final'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {sale.sellerName || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(sale.total)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <Badge
                              variant={
                                sale.status === 'Pago'
                                  ? 'default'
                                  : sale.status === 'Cancelado'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className={sale.status === 'Pago' ? 'bg-emerald-500' : ''}
                            >
                              {sale.status}
                            </Badge>
                            {sale.status === 'Pendente' && (
                              <span className="text-[10px] text-muted-foreground max-w-[120px] truncate">
                                {sale.pendingReason || 'Pagamento'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Ações</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailsSale(sale)}>
                                <FileText className="mr-2 h-4 w-4" /> Detalhes e Histórico
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleClone(sale)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Clonar Pedido
                              </DropdownMenuItem>
                              {sale.status !== 'Cancelado' && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSaleToCancel(sale)
                                    setReturnToStock(true)
                                  }}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Cancelar Pedido
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        <CalendarDays className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        Nenhuma venda encontrada para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-3 opacity-20" />
                      Defina os filtros e clique em "Pesquisar" para visualizar as vendas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={!!saleToCancel}
        onOpenChange={(open) => {
          if (!open) {
            setSaleToCancel(null)
            setCancelReason('')
            setReturnToStock(true)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Ban className="h-5 w-5" /> Confirmar Cancelamento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a cancelar o pedido <strong>{saleToCancel?.id}</strong>. Isso
              atualizará o status da venda e poderá afetar o estoque e financeiro do cliente. Tem
              certeza que deseja prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4 border-y my-2">
            <div className="space-y-1.5">
              <Label htmlFor="cancelReason" className="flex items-center gap-1">
                Motivo do Cancelamento <span className="text-destructive">*</span>
              </Label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger id="cancelReason">
                  <SelectValue placeholder="Selecione um motivo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Desistência">Desistência</SelectItem>
                  <SelectItem value="Venda Errada">Venda Errada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasPhysicalProducts && (
              <div className="bg-muted/40 p-3 rounded-md border space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="returnStock"
                    checked={returnToStock}
                    onCheckedChange={setReturnToStock}
                  />
                  <Label htmlFor="returnStock" className="cursor-pointer font-medium">
                    Reentrada no Estoque
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-11">
                  {returnToStock
                    ? 'Os itens deste pedido voltarão para o inventário físico automaticamente.'
                    : 'Os itens NÃO retornarão para o inventário. O estoque continuará deduzido.'}
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleCancelConfirm()
              }}
              disabled={!cancelReason}
              className="bg-destructive hover:bg-destructive/90 text-white disabled:opacity-50"
            >
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!detailsSale} onOpenChange={(open) => !open && setDetailsSale(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido {detailsSale?.id}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="resumo" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="resumo" className="space-y-4 pt-4">
              {detailsSale && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium">
                      {detailsSale.customer || 'Consumidor Final'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Data:</span>
                    <span>{new Date(detailsSale.date).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 items-start">
                    <span className="text-muted-foreground mt-0.5">Status:</span>
                    <div className="text-right">
                      <Badge
                        variant={detailsSale.status === 'Cancelado' ? 'destructive' : 'default'}
                      >
                        {detailsSale.status}
                      </Badge>
                      {detailsSale.status === 'Pendente' && (
                        <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px]">
                          {detailsSale.pendingReason || 'Pagamento'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Forma de Pagamento:</span>
                    <span className="font-medium">{detailsSale.paymentMethod || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Vendedor:</span>
                    <span>{detailsSale.sellerName || '-'}</span>
                  </div>
                  <div className="mt-4 pt-2">
                    <h4 className="font-semibold mb-2">Itens:</h4>
                    <ul className="space-y-1 max-h-[150px] overflow-y-auto pr-2">
                      {detailsSale.items.map((item, i) => (
                        <li key={i} className="flex justify-between">
                          <span>
                            {item.quantity}x {item.product.name}
                          </span>
                          <span>{formatCurrency(item.total)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between font-bold mt-4 pt-2 border-t text-lg">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(detailsSale.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="historico" className="space-y-4 pt-4">
              <ScrollArea className="h-[250px] pr-4">
                {detailsSale?.history && detailsSale.history.length > 0 ? (
                  <div className="space-y-4">
                    {detailsSale.history.map((log, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-start text-sm border-b pb-3"
                      >
                        <div>
                          <p className="font-medium text-primary">{log.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Por: {log.userName}
                          </p>
                          {log.paymentMethod && (
                            <p className="text-[11px] text-muted-foreground mt-1 font-medium bg-muted/50 inline-block px-1.5 py-0.5 rounded">
                              Pagamento: {log.paymentMethod}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap ml-4 mt-0.5">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum histórico registrado para este pedido.
                  </p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Print View */}
      <div className="hidden print:block text-black bg-white w-full">
        <div className="mb-6 border-b-2 border-black pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">Extrato de Vendas</h1>
            <p className="text-sm mt-1 text-gray-600">Período/Filtro: {periodLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Resumo do Filtro
            </p>
            <p className="text-xl font-bold">{formatCurrency(totalSalesAmount)}</p>
          </div>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2 font-bold w-1/4">Data / ID</th>
              <th className="text-left py-2 font-bold w-1/2">Cliente</th>
              <th className="text-right py-2 font-bold w-1/4">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale) => (
              <tr
                key={sale.id}
                className={`border-b border-gray-200 ${sale.status === 'Cancelado' ? 'text-gray-400 line-through' : ''}`}
              >
                <td className="py-2">
                  {new Date(sale.date).toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                  <div className="text-xs text-gray-500">{sale.id}</div>
                </td>
                <td className="py-2">
                  <span className="font-medium">{sale.customer || 'Consumidor Final'}</span>
                  {sale.status === 'Cancelado' && (
                    <span className="ml-2 text-xs italic">(Cancelada)</span>
                  )}
                  {sale.status === 'Pendente' && (
                    <span className="ml-2 text-xs italic text-gray-500">
                      (Pendente: {sale.pendingReason || 'Pagamento'})
                    </span>
                  )}
                </td>
                <td className="py-2 text-right tabular-nums">{formatCurrency(sale.total)}</td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500 italic">
                  Nenhuma venda registrada no período selecionado.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black">
              <td colSpan={2} className="py-3 font-bold text-right text-sm uppercase">
                Total em Vendas Válidas:
              </td>
              <td className="py-3 font-bold text-right text-base tabular-nums">
                {formatCurrency(totalSalesAmount)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-center text-gray-500">
          Documento gerado em {new Date().toLocaleString('pt-BR')} - Sistema ConstruMaster
        </div>
      </div>
    </>
  )
}
