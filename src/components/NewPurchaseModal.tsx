import { useState, useMemo, useEffect } from 'react'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { ShoppingCart, Trash2, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'

export function NewPurchaseModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { products, suppliers, addPurchase, addPayable } = useAppContext()

  const [selectedSupplier, setSelectedSupplier] = useState('none')
  const [purchaseItems, setPurchaseItems] = useState<
    { product: any; quantity: number; costPrice: number }[]
  >([])
  const [installments, setInstallments] = useState<{ dueDate: string; amount: number }[]>([])
  const [filterCategory, setFilterCategory] = useState('all')

  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    suppliers.forEach((s) => s.categories?.forEach((c) => cats.add(c)))
    return Array.from(cats).sort()
  }, [suppliers])

  const filteredSuppliers = useMemo(() => {
    if (filterCategory === 'all') return suppliers
    return suppliers.filter((s) =>
      s.categories?.some((c) => c.toLowerCase() === filterCategory.toLowerCase()),
    )
  }, [suppliers, filterCategory])

  const total = useMemo(
    () => purchaseItems.reduce((acc, item) => acc + item.quantity * item.costPrice, 0),
    [purchaseItems],
  )

  useEffect(() => {
    if (installments.length <= 1) {
      setInstallments([{ dueDate: installments[0]?.dueDate || '', amount: total }])
    }
  }, [total, installments.length])

  const handleSave = () => {
    if (selectedSupplier === 'none' || purchaseItems.length === 0) {
      return toast({ variant: 'destructive', title: 'Preencha os campos obrigatórios' })
    }

    const instSum = installments.reduce((acc, curr) => acc + curr.amount, 0)
    if (installments.length === 0 || installments.some((i) => !i.dueDate || i.amount <= 0)) {
      return toast({
        variant: 'destructive',
        title: 'Atenção',
        description: 'Valores e datas de vencimento são obrigatórios.',
      })
    }

    if (Math.abs(total - instSum) > 0.01) {
      return toast({
        variant: 'destructive',
        title: 'Valores Incorretos',
        description: 'A soma das parcelas difere do total.',
      })
    }

    const supplierName = suppliers.find((s) => s.id === selectedSupplier)?.name || ''
    const p = addPurchase({
      supplierId: selectedSupplier,
      supplierName,
      items: purchaseItems,
      total,
    })

    installments.forEach((inst, i) => {
      addPayable({
        supplierId: selectedSupplier,
        supplierName,
        description: `Parcela ${i + 1}/${installments.length} - Compra #${p.id}`,
        amount: inst.amount,
        dueDate: new Date(inst.dueDate).toISOString(),
        purchaseId: p.id,
      })
    })

    onOpenChange(false)
    setPurchaseItems([])
    setSelectedSupplier('none')
    setInstallments([])
  }

  const generateInstallments = (count: number) => {
    setInstallments(
      Array.from({ length: count }).map((_, i) => {
        const date = new Date()
        date.setDate(date.getDate() + (i + 1) * 30)
        return { dueDate: date.toISOString().split('T')[0], amount: total / count }
      }),
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b shrink-0 bg-muted/10">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Registrar Entrada de Mercadoria
          </DialogTitle>
          <DialogDescription>
            Lance os produtos no estoque e gere as obrigações financeiras para o contas a pagar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x">
          <div className="flex-1 p-6 space-y-6 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filtrar Fornecedores</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {allCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione...</SelectItem>
                    {filteredSuppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Adicionar Produtos à Nota</Label>
              <Select
                onValueChange={(v) => {
                  const p = products.find((x) => x.id === v)
                  if (p && !purchaseItems.find((c) => c.product.id === p.id)) {
                    setPurchaseItems([
                      ...purchaseItems,
                      { product: p, quantity: 1, costPrice: p.costPrice },
                    ])
                  }
                }}
                value=""
              >
                <SelectTrigger>
                  <SelectValue placeholder="Buscar produto..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="border rounded-md mt-2">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-[100px] text-center">Qtd.</TableHead>
                      <TableHead className="w-[120px] text-right">Custo Un.</TableHead>
                      <TableHead className="w-[100px] text-right">Total</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseItems.map((item) => (
                      <TableRow key={item.product.id}>
                        <TableCell className="py-2 text-sm font-medium">
                          {item.product.name}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            min="1"
                            className="h-8 text-center px-1"
                            value={item.quantity}
                            onChange={(e) =>
                              setPurchaseItems(
                                purchaseItems.map((i) =>
                                  i.product.id === item.product.id
                                    ? { ...i, quantity: Number(e.target.value) }
                                    : i,
                                ),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-8 text-right px-1"
                            value={item.costPrice}
                            onChange={(e) =>
                              setPurchaseItems(
                                purchaseItems.map((i) =>
                                  i.product.id === item.product.id
                                    ? { ...i, costPrice: Number(e.target.value) }
                                    : i,
                                ),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="py-2 text-right font-medium text-sm">
                          {formatCurrency(item.quantity * item.costPrice)}
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() =>
                              setPurchaseItems(
                                purchaseItems.filter((x) => x.product.id !== item.product.id),
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {purchaseItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          Nenhum produto adicionado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[350px] p-6 bg-muted/10 flex flex-col gap-6">
            <div>
              <Label className="text-base font-semibold text-primary">Detalhes Financeiros</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-4 leading-tight">
                Toda entrada de estoque gera uma obrigação no Contas a Pagar. Defina os vencimentos
                abaixo.
              </p>

              <div className="flex justify-between items-center bg-white p-3 rounded-lg border mb-4">
                <span className="font-semibold text-sm">Total da Compra</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>

              <div className="space-y-3">
                <Select defaultValue="1" onValueChange={(v) => generateInstallments(Number(v))}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Dividir em..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}x parcelas
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-2 mt-4 max-h-[250px] overflow-y-auto pr-1">
                  {installments.map((inst, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded border">
                      <div className="text-xs font-medium w-4 shrink-0 text-muted-foreground">
                        {idx + 1}
                      </div>
                      <Input
                        type="date"
                        className="h-8 px-2 flex-1 text-sm"
                        value={inst.dueDate}
                        onChange={(e) => {
                          const newInst = [...installments]
                          newInst[idx].dueDate = e.target.value
                          setInstallments(newInst)
                        }}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 w-24 text-right px-2 text-sm"
                        value={inst.amount}
                        onChange={(e) => {
                          const newInst = [...installments]
                          newInst[idx].amount = Number(e.target.value)
                          setInstallments(newInst)
                        }}
                      />
                    </div>
                  ))}
                </div>

                {installments.length > 0 &&
                  Math.abs(total - installments.reduce((acc, curr) => acc + curr.amount, 0)) >
                    0.01 && (
                    <Alert variant="destructive" className="py-2 px-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-xs font-bold mb-0">Divergência</AlertTitle>
                      <AlertDescription className="text-[10px]">
                        A soma das parcelas difere do total.
                      </AlertDescription>
                    </Alert>
                  )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-background shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            Confirmar Entrada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
