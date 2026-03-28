import { useState } from 'react'
import { Plus, Pencil, Trash2, Tags, Search, History, Wallet, RefreshCcw } from 'lucide-react'
import { useAppContext, Seller } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Sellers() {
  const {
    sellers,
    addSeller,
    updateSeller,
    deleteSeller,
    sellerCreditHistory,
    adjustSellerBalance,
    setSellerBalance,
  } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')

  const [isStatementOpen, setIsStatementOpen] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)

  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [adjustType, setAdjustType] = useState<'add' | 'edit'>('add')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  const filteredSellers = sellers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const openNew = () => {
    setEditingSeller(null)
    setCode('')
    setName('')
    setIsFormOpen(true)
  }

  const openEdit = (seller: Seller) => {
    setEditingSeller(seller)
    setCode(seller.code)
    setName(seller.name)
    setIsFormOpen(true)
  }

  const handleSave = () => {
    if (!code.trim() || !name.trim()) return

    if (editingSeller) {
      updateSeller(editingSeller.id, { code: code.trim(), name: name.trim() })
    } else {
      addSeller({ code: code.trim(), name: name.trim() })
    }
    setIsFormOpen(false)
  }

  const openStatement = (seller: Seller) => {
    setSelectedSeller(seller)
    setIsStatementOpen(true)
  }

  const openAdjust = (seller: Seller) => {
    setSelectedSeller(seller)
    setAdjustType('add')
    setAdjustAmount('')
    setAdjustReason('')
    setIsAdjustOpen(true)
  }

  const handleAdjust = () => {
    if (!selectedSeller) return
    const amount = parseFloat(adjustAmount)
    if (isNaN(amount) || amount < 0) return
    if (!adjustReason.trim()) return

    if (adjustType === 'add') {
      adjustSellerBalance(selectedSeller.id, amount, 'manual_add', adjustReason)
    } else {
      setSellerBalance(selectedSeller.id, amount, adjustReason)
    }
    setIsAdjustOpen(false)
  }

  const handleReset = () => {
    if (!selectedSeller) return
    if (!adjustReason.trim()) return
    setSellerBalance(selectedSeller.id, 0, adjustReason)
    setIsAdjustOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Vendedores</h1>
          <p className="text-muted-foreground">
            Gerencie a equipe de vendas e seus saldos de crédito/débito.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Vendedor
        </Button>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Saldo Atual</TableHead>
              <TableHead className="text-right">Total Créditos</TableHead>
              <TableHead className="text-right">Total Débitos</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSellers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Tags className="h-4 w-4 text-primary" />
                    {s.code}
                  </div>
                </TableCell>
                <TableCell className="font-bold">{s.name}</TableCell>
                <TableCell
                  className={cn(
                    'text-right font-bold text-lg',
                    s.currentBalance > 0 ? 'text-primary' : '',
                  )}
                >
                  {formatCurrency(s.currentBalance)}
                </TableCell>
                <TableCell className="text-right text-emerald-600 font-medium">
                  +{formatCurrency(s.totalCredits)}
                </TableCell>
                <TableCell className="text-right text-red-600 font-medium">
                  -{formatCurrency(s.totalDebits)}
                </TableCell>
                <TableCell className="text-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Ver Extrato"
                    onClick={() => openStatement(s)}
                  >
                    <History className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Ajustar Saldo"
                    onClick={() => openAdjust(s)}
                  >
                    <Wallet className="h-4 w-4 text-amber-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => deleteSeller(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredSellers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum vendedor encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Seller Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSeller ? 'Editar Vendedor' : 'Novo Vendedor'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Código do Vendedor (ID / Crachá)</Label>
              <Input
                placeholder="Ex: V001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                placeholder="Ex: Pedro Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!code.trim() || !name.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Balance Modal */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Saldo - {selectedSeller?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg border">
              <span className="text-sm font-medium">Saldo Atual:</span>
              <span className="text-lg font-bold">
                {formatCurrency(selectedSeller?.currentBalance || 0)}
              </span>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Ajuste</Label>
              <Select value={adjustType} onValueChange={(v: 'add' | 'edit') => setAdjustType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Adicionar Créditos</SelectItem>
                  <SelectItem value="edit">Definir Novo Saldo (Manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{adjustType === 'add' ? 'Valor a Adicionar (R$)' : 'Novo Saldo (R$)'}</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo / Justificativa</Label>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Ex: Premiação por meta"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={handleReset}
              disabled={!adjustReason.trim()}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Zerar Saldo
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAdjust}
                disabled={!adjustReason.trim() || !adjustAmount || parseFloat(adjustAmount) < 0}
              >
                Confirmar Ajuste
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statement / Extrato Modal */}
      <Dialog open={isStatementOpen} onOpenChange={setIsStatementOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Extrato de Créditos - {selectedSeller?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-6 mb-4 mt-2">
            <div className="bg-primary/10 px-4 py-2 rounded-lg">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block">
                Saldo Atual
              </span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(selectedSeller?.currentBalance || 0)}
              </span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block">Total de Entradas</span>
              <span className="text-emerald-600 font-bold">
                {formatCurrency(selectedSeller?.totalCredits || 0)}
              </span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block">Total de Saídas</span>
              <span className="text-red-600 font-bold">
                {formatCurrency(selectedSeller?.totalDebits || 0)}
              </span>
            </div>
          </div>
          <ScrollArea className="h-[400px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Pedido / Ref</TableHead>
                  <TableHead>Motivo / Operador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Saldo Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedSeller &&
                  sellerCreditHistory
                    .filter((h) => h.sellerId === selectedSeller.id)
                    .sort(
                      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                    )
                    .map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(h.createdAt).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>{h.saleId || '-'}</TableCell>
                        <TableCell>
                          <span className="block truncate max-w-[200px]" title={h.reason}>
                            {h.reason || '-'}
                          </span>
                          <span className="text-xs text-muted-foreground">Por: {h.createdBy}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={h.value > 0 ? 'default' : 'destructive'}
                            className={h.value > 0 ? 'bg-emerald-500' : ''}
                          >
                            {h.type === 'credito'
                              ? 'Crédito Venda'
                              : h.type === 'debito'
                                ? 'Débito Venda'
                                : h.type === 'manual_add'
                                  ? 'Adição Manual'
                                  : h.type === 'manual_edit'
                                    ? 'Ajuste Manual'
                                    : 'Reset'}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-medium',
                            h.value > 0 ? 'text-emerald-600' : 'text-red-600',
                          )}
                        >
                          {h.value > 0 ? '+' : ''}
                          {formatCurrency(h.value)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(h.newBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                {(!selectedSeller ||
                  sellerCreditHistory.filter((h) => h.sellerId === selectedSeller.id).length ===
                    0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
