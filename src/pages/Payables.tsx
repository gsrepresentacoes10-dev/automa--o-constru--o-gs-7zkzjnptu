import { useState, useMemo } from 'react'
import { useAppContext, type Payable, type Supplier } from '@/context/AppContext'
import { formatCurrency, cn } from '@/lib/utils'
import {
  Wallet,
  CheckCircle2,
  Search,
  AlertCircle,
  MessageCircle,
  Pencil,
  Bot,
  Zap,
  Plus,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
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
import { Switch } from '@/components/ui/switch'
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const getSanitizedPhone = (phone?: string) => {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }
  return digits
}

const handleWhatsAppReminder = (payable: Payable, supplier?: Supplier) => {
  const phone = getSanitizedPhone(supplier?.contact)
  if (!phone) return

  const formattedAmount = formatCurrency(payable.amount)
  const formattedDate = payable.dueDate
    ? new Date(payable.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : '-'

  const message = `Olá, gostaria de lembrar sobre o pagamento de ${payable.description} no valor de ${formattedAmount}, com vencimento em ${formattedDate}.`
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  window.open(url, '_blank')
}

export default function Payables() {
  const { payables, markPayableAsPaid, suppliers, addPayable, updatePayable } = useAppContext()
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('all')

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedPayableId, setSelectedPayableId] = useState<string | null>(null)
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    supplierId: '',
    description: '',
    amount: '',
    dueDate: '',
    autoReminder: false,
  })

  const filteredPayables = useMemo(() => {
    return payables
      .filter((payable) => {
        const isPending = payable.status === 'Pendente'
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const isOverdue = isPending && payable.dueDate && new Date(payable.dueDate) < today

        if (statusFilter === 'pending' && (!isPending || isOverdue)) return false
        if (statusFilter === 'overdue' && !isOverdue) return false
        if (statusFilter === 'paid' && payable.status !== 'Pago') return false

        if (supplierFilter !== 'all' && payable.supplierId !== supplierFilter) return false

        if (dateFrom && new Date(payable.dueDate) < new Date(dateFrom)) return false
        if (
          dateTo &&
          new Date(payable.dueDate) > new Date(new Date(dateTo).setHours(23, 59, 59, 999))
        )
          return false

        return true
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [payables, statusFilter, dateFrom, dateTo, supplierFilter])

  const pendingTotal = filteredPayables
    .filter((s) => s.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const overdueTotal = filteredPayables
    .filter((s) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return s.status === 'Pendente' && s.dueDate && new Date(s.dueDate) < today
    })
    .reduce((acc, curr) => acc + curr.amount, 0)

  const handleOpenPayment = (id: string) => {
    setSelectedPayableId(id)
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaymentDialogOpen(true)
  }

  const handleConfirmPayment = () => {
    if (selectedPayableId) {
      markPayableAsPaid(selectedPayableId, new Date(paymentDate).toISOString())
    }
    setPaymentDialogOpen(false)
    setSelectedPayableId(null)
  }

  const handleOpenForm = (payable?: Payable) => {
    if (payable) {
      setEditingId(payable.id)
      setFormData({
        supplierId: payable.supplierId,
        description: payable.description,
        amount: payable.amount.toString(),
        dueDate: payable.dueDate ? new Date(payable.dueDate).toISOString().split('T')[0] : '',
        autoReminder: payable.autoReminder || false,
      })
    } else {
      setEditingId(null)
      setFormData({
        supplierId: suppliers[0]?.id || '',
        description: '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        autoReminder: false,
      })
    }
    setIsFormOpen(true)
  }

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault()
    const supplier = suppliers.find((s) => s.id === formData.supplierId)
    if (!supplier) return

    const payload = {
      supplierId: formData.supplierId,
      supplierName: supplier.name,
      description: formData.description,
      amount: parseFloat(formData.amount),
      dueDate: new Date(formData.dueDate).toISOString(),
      autoReminder: formData.autoReminder,
    }

    if (editingId) {
      updatePayable(editingId, payload)
    } else {
      addPayable(payload)
    }
    setIsFormOpen(false)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overduePayables = payables.filter(
    (p) => p.status === 'Pendente' && new Date(p.dueDate) < today,
  )
  const dueTodayPayables = payables.filter(
    (p) => p.status === 'Pendente' && new Date(p.dueDate).getTime() === today.getTime(),
  )

  const autoRemindersPending = payables.filter((p) => p.status === 'Pendente' && p.autoReminder)

  const handleBatchProcess = () => {
    if (autoRemindersPending.length === 0) return
    let processed = 0
    autoRemindersPending.forEach((payable) => {
      const supplier = suppliers.find((s) => s.id === payable.supplierId)
      const phone = getSanitizedPhone(supplier?.contact)
      if (phone) {
        const formattedAmount = formatCurrency(payable.amount)
        const formattedDate = payable.dueDate
          ? new Date(payable.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
          : '-'
        const message = `Olá, gostaria de lembrar sobre o pagamento de ${payable.description} no valor de ${formattedAmount}, com vencimento em ${formattedDate}.`
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
        processed++
      }
    })
    toast({
      title: 'Processamento Concluído',
      description: `${processed} guias do WhatsApp abertas. Lembre-se de permitir pop-ups no navegador caso seja bloqueado.`,
    })
  }

  const selectedFormSupplier = suppliers.find((s) => s.id === formData.supplierId)
  const hasValidPhone = !!getSanitizedPhone(selectedFormSupplier?.contact)

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
                Existem {overduePayables.length} conta(s) em atraso no valor total de{' '}
                {formatCurrency(overduePayables.reduce((a, b) => a + b.amount, 0))}.
              </AlertDescription>
            </Alert>
          )}
          {dueTodayPayables.length > 0 && (
            <Alert className="bg-amber-50 border-amber-200 text-amber-800 [&>svg]:text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Vencendo Hoje</AlertTitle>
              <AlertDescription>
                Existem {dueTodayPayables.length} conta(s) vencendo hoje no valor total de{' '}
                {formatCurrency(dueTodayPayables.reduce((a, b) => a + b.amount, 0))}.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-muted-foreground">
            Gestão de despesas com fornecedores e obrigações geradas pelas compras.
          </p>
        </div>
        <div className="flex gap-2">
          {autoRemindersPending.length > 0 && (
            <Button
              onClick={handleBatchProcess}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              Lembretes Automáticos ({autoRemindersPending.length})
            </Button>
          )}
          <Button onClick={() => handleOpenForm()}>
            <Plus className="h-4 w-4 mr-2" /> Nova Conta
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">
              Total a Pagar (Filtro)
            </CardTitle>
            <Wallet className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{formatCurrency(pendingTotal)}</div>
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
        <div className="p-4 border-b flex flex-col lg:flex-row gap-4 bg-muted/20">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="text-xs text-muted-foreground">Fornecedor</Label>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Fornecedores</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 flex-1 min-w-[200px]">
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
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Vencimento Inicial</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Vencimento Final</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter('all')
                setSupplierFilter('all')
                setDateFrom('')
                setDateTo('')
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
                <TableHead>Fornecedor</TableHead>
                <TableHead>Descrição / Ref</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayables.map((payable) => {
                const isPending = payable.status === 'Pendente'
                const payDueDate = new Date(payable.dueDate)
                payDueDate.setHours(0, 0, 0, 0)
                const isOverdue = isPending && payDueDate < today
                const isDueToday = isPending && payDueDate.getTime() === today.getTime()

                const supplier = suppliers.find((s) => s.id === payable.supplierId)
                const phone = getSanitizedPhone(supplier?.contact)
                const hasPhone = !!phone

                return (
                  <TableRow
                    key={payable.id}
                    className={cn(
                      isOverdue && 'bg-destructive/10',
                      isDueToday && 'bg-amber-500/10',
                    )}
                  >
                    <TableCell className="font-medium">{payable.supplierName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div>{payable.description}</div>
                      <div className="text-xs">ID: {payable.id}</div>
                    </TableCell>
                    <TableCell
                      className={
                        isOverdue ? 'text-destructive font-bold flex items-center gap-1.5' : ''
                      }
                    >
                      {isOverdue && <AlertCircle className="h-4 w-4" />}
                      {payable.dueDate
                        ? new Date(payable.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payable.amount)}
                    </TableCell>
                    <TableCell className="text-center space-y-1">
                      <div>
                        <Badge
                          variant={isOverdue ? 'destructive' : isPending ? 'secondary' : 'default'}
                          className={!isPending ? 'bg-emerald-500' : ''}
                        >
                          {isOverdue ? 'Atrasado' : payable.status}
                        </Badge>
                      </div>
                      {payable.autoReminder && isPending && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          <Bot className="w-3 h-3 mr-1" /> Auto
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPending && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-block">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={cn(
                                      'w-9 p-0 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300',
                                      !hasPhone && 'opacity-50 pointer-events-none grayscale',
                                    )}
                                    onClick={() => {
                                      if (hasPhone) handleWhatsAppReminder(payable, supplier)
                                    }}
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {hasPhone
                                    ? 'Enviar lembrete via WhatsApp'
                                    : 'Fornecedor sem telefone cadastrado'}
                                </p>
                              </TooltipContent>
                            </Tooltip>

                            <Button
                              size="sm"
                              variant="outline"
                              className="w-9 p-0"
                              onClick={() => handleOpenForm(payable)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {isPending ? (
                          <Button
                            size="sm"
                            variant={isOverdue ? 'default' : 'outline'}
                            onClick={() => handleOpenPayment(payable.id)}
                            className={cn(
                              isOverdue
                                ? 'bg-destructive hover:bg-destructive/90 text-white'
                                : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200',
                              isDueToday &&
                                'bg-amber-500 hover:bg-amber-600 text-white border-transparent',
                            )}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Baixar Pagamento
                          </Button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Liquidado
                            {payable.paymentDate && (
                              <span className="text-[10px] text-muted-foreground ml-1">
                                ({new Date(payable.paymentDate).toLocaleDateString('pt-BR')})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredPayables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    Nenhuma conta a pagar encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Baixar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Data de Pagamento</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Confirmar o pagamento mudará o status desta conta para "Pago" e refletirá no fluxo de
              caixa.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayment} className="bg-emerald-600 hover:bg-emerald-700">
              Confirmar Baixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <form onSubmit={handleSaveForm}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select
                  value={formData.supplierId}
                  onValueChange={(val) => setFormData({ ...formData, supplierId: val })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descrição / Referência</Label>
                <Input
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Compra de cimento"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border p-3 rounded-lg mt-2">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-600" />
                    Enviar lembrete automaticamente
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permite processar esta conta em lote para envio de WhatsApp.
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <Switch
                        checked={formData.autoReminder}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, autoReminder: checked })
                        }
                        disabled={!hasValidPhone}
                      />
                    </div>
                  </TooltipTrigger>
                  {!hasValidPhone && (
                    <TooltipContent>
                      <p>O fornecedor selecionado não possui um telefone válido cadastrado.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
