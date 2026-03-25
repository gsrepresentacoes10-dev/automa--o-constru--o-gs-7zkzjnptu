import { useState, useMemo } from 'react'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Landmark,
  CheckCircle2,
  Search,
  AlertCircle,
  Link as LinkIcon,
  MessageCircle,
  BellRing,
  CalendarIcon,
  Settings,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'

export default function Receivables() {
  const { sales, updateSale, markSaleAsPaid, customers } = useAppContext()
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [clientSearch, setClientSearch] = useState('')

  const [configuringSaleId, setConfiguringSaleId] = useState<string | null>(null)
  const [reminderActive, setReminderActive] = useState(false)
  const [reminderDate, setReminderDate] = useState<Date | undefined>(undefined)

  const creditSales = useMemo(
    () => sales.filter((s) => s.paymentMethod === 'Venda a Prazo'),
    [sales],
  )

  const filteredReceivables = useMemo(() => {
    return creditSales
      .filter((sale) => {
        const isPending = sale.status === 'Pendente'
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const isOverdue = isPending && sale.dueDate && new Date(sale.dueDate) < today

        if (statusFilter === 'pending' && (!isPending || isOverdue)) return false
        if (statusFilter === 'overdue' && !isOverdue) return false
        if (statusFilter === 'paid' && sale.status !== 'Pago') return false

        if (dateFrom && new Date(sale.date) < new Date(dateFrom)) return false
        if (dateTo && new Date(sale.date) > new Date(new Date(dateTo).setHours(23, 59, 59, 999)))
          return false

        if (clientSearch.trim()) {
          const cName = sale.customer?.toLowerCase() || ''
          if (!cName.includes(clientSearch.trim().toLowerCase())) return false
        }

        return true
      })
      .sort(
        (a, b) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime(),
      )
  }, [creditSales, statusFilter, dateFrom, dateTo, clientSearch])

  const pendingTotal = filteredReceivables
    .filter((s) => s.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.total, 0)

  const overdueTotal = filteredReceivables
    .filter((s) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return s.status === 'Pendente' && s.dueDate && new Date(s.dueDate) < today
    })
    .reduce((acc, curr) => acc + curr.total, 0)

  const handleMarkAsPaid = (id: string, customer: string | undefined) => {
    markSaleAsPaid(id)
    toast({
      title: 'Pagamento Registrado',
      description: `A venda de ${customer || 'Cliente'} foi marcada como paga.`,
    })
  }

  const copyPaymentLink = (id: string) => {
    const link = `${window.location.origin}/checkout/sale/${id}`
    navigator.clipboard.writeText(link)
    toast({
      title: 'Link Copiado',
      description: 'O link de pagamento da cobrança foi copiado.',
    })
  }

  const openConfigDialog = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId)
    if (!sale) return
    setReminderActive(sale.whatsappReminder || false)
    setReminderDate(sale.whatsappReminderDate ? new Date(sale.whatsappReminderDate) : undefined)
    setConfiguringSaleId(saleId)
  }

  const handleSaveConfig = () => {
    if (configuringSaleId) {
      if (reminderActive && !reminderDate) {
        toast({
          variant: 'destructive',
          title: 'Data Incompleta',
          description: 'Selecione a data para a notificação.',
        })
        return
      }
      updateSale(configuringSaleId, {
        whatsappReminder: reminderActive,
        whatsappReminderDate: reminderDate ? reminderDate.toISOString() : undefined,
      })
      toast({ title: 'Configuração Salva', description: 'Notificação de cobrança atualizada.' })
    }
    setConfiguringSaleId(null)
  }

  const sendWhatsappBilling = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId)
    if (!sale) return
    const customer = customers.find((c) => c.id === sale.customerId)
    const link = `${window.location.origin}/checkout/sale/${sale.id}`
    const text = `Olá${sale.customer ? ` ${sale.customer}` : ''}, informamos que seu pedido *#${sale.id}* no valor de ${formatCurrency(sale.total)} tem o vencimento programado para ${sale.dueDate ? new Date(sale.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}.\n\n💳 *Para sua comodidade, você pode realizar o pagamento diretamente pelo link:* \n${link}\n\nSe já efetuou o pagamento, por favor, desconsidere esta mensagem.`
    const cleanPhone = (customer?.phone || '').replace(/\D/g, '')

    if (cleanPhone) {
      window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank')
    } else {
      toast({
        variant: 'destructive',
        title: 'Sem telefone',
        description: 'O cliente não possui um telefone cadastrado para WhatsApp.',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Relatório de Inadimplência / Contas a Receber
          </h1>
          <p className="text-muted-foreground">
            Gerencie pagamentos pendentes, ative cobranças automáticas e receba online.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Total a Receber (Filtro)
            </CardTitle>
            <Landmark className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(pendingTotal)}</div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Total em Atraso (Filtro)
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(overdueTotal)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b flex flex-col lg:flex-row gap-4 bg-muted/20 items-end">
          <div className="space-y-1.5 flex-1 w-full lg:max-w-[250px]">
            <Label className="text-xs text-muted-foreground">Buscar Cliente</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome do cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 flex-1 w-full lg:max-w-[200px]">
            <Label className="text-xs text-muted-foreground">Status do Pagamento</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Apenas Pendentes (No Prazo)</SelectItem>
                <SelectItem value="overdue">Atrasados (Vencidos)</SelectItem>
                <SelectItem value="paid">Pagos (Liquidados)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-full lg:w-auto">
            <Label className="text-xs text-muted-foreground">Data Inicial (Venda)</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5 w-full lg:w-auto">
            <Label className="text-xs text-muted-foreground">Data Final (Venda)</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end w-full lg:w-auto justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter('all')
                setDateFrom('')
                setDateTo('')
                setClientSearch('')
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Nº Venda</TableHead>
                <TableHead>Data da Venda</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações Rápidas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceivables.map((sale) => {
                const isPending = sale.status === 'Pendente'
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const isOverdue = isPending && sale.dueDate && new Date(sale.dueDate) < today

                return (
                  <TableRow key={sale.id} className={isOverdue ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {sale.customer}
                        {sale.whatsappReminder && sale.whatsappReminderDate && isPending && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <BellRing className="h-3 w-3 text-emerald-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Cobrança programada para:{' '}
                              {format(new Date(sale.whatsappReminderDate), 'dd/MM/yyyy')}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{sale.id}</TableCell>
                    <TableCell>{new Date(sale.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell
                      className={
                        isOverdue ? 'text-destructive font-bold flex items-center gap-1.5' : ''
                      }
                    >
                      {isOverdue && <AlertCircle className="h-4 w-4" />}
                      {sale.dueDate
                        ? new Date(sale.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={isOverdue ? 'destructive' : isPending ? 'secondary' : 'default'}
                        className={!isPending ? 'bg-emerald-500' : ''}
                      >
                        {isOverdue ? 'Atrasado' : sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isPending ? (
                        <div className="flex justify-end items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openConfigDialog(sale.id)}
                            className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            title="Configurar Notificação"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => sendWhatsappBilling(sale.id)}
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Cobrar via WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyPaymentLink(sale.id)}
                            className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                            title="Link de Pagamento"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={isOverdue ? 'default' : 'outline'}
                            onClick={() => handleMarkAsPaid(sale.id, sale.customer)}
                            className={
                              isOverdue
                                ? 'bg-destructive hover:bg-destructive/90 text-white ml-2'
                                : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 ml-2'
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Baixar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Liquidado
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredReceivables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    Nenhum registro encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!configuringSaleId}
        onOpenChange={(open) => !open && setConfiguringSaleId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Cobrança Automática</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Notificação via WhatsApp</Label>
                <p className="text-xs text-muted-foreground max-w-[280px]">
                  Ativar o envio automático do link de pagamento para cobrança desta parcela.
                </p>
              </div>
              <Switch checked={reminderActive} onCheckedChange={setReminderActive} />
            </div>

            {reminderActive && (
              <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                <Label>
                  Programar Data de Envio <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !reminderDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reminderDate ? (
                        format(reminderDate, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Selecione a data de envio</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={reminderDate}
                      onSelect={setReminderDate}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfiguringSaleId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveConfig} className="bg-indigo-600 hover:bg-indigo-700">
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
