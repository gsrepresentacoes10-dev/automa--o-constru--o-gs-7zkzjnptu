import { useState } from 'react'
import { useAppContext, PurchaseItem } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Plus, ShoppingBag, Trash2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Purchases() {
  const { purchases, suppliers, products, addPurchase } = useAppContext()
  const [isAdding, setIsAdding] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState<PurchaseItem[]>([])

  const addItem = (productId: string) => {
    const p = products.find((prod) => prod.id === productId)
    if (!p) return
    if (!items.find((i) => i.product.id === p.id)) {
      setItems([...items, { product: p, quantity: 1, costPrice: p.costPrice }])
    }
  }

  const updateItem = (id: string, field: keyof PurchaseItem, value: number) => {
    setItems(items.map((i) => (i.product.id === id ? { ...i, [field]: value } : i)))
  }

  const total = items.reduce((acc, i) => acc + i.quantity * i.costPrice, 0)

  const handleSave = () => {
    if (!supplierId || items.length === 0) return
    addPurchase({
      supplierId,
      supplierName: suppliers.find((s) => s.id === supplierId)?.name,
      items,
      total,
    })
    setIsAdding(false)
    setItems([])
    setSupplierId('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Entrada de Mercadorias</h1>
          <p className="text-muted-foreground">Registre compras e abasteça seu estoque.</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Entrada
        </Button>
      </div>

      <div className="bg-card border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="text-right">Itens</TableHead>
              <TableHead className="text-right">Total da Nota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.id}</TableCell>
                <TableCell>{new Date(p.date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" /> {p.supplierName}
                </TableCell>
                <TableCell className="text-right">
                  {p.items.reduce((acc, i) => acc + i.quantity, 0)}
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(p.total)}</TableCell>
              </TableRow>
            ))}
            {purchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma entrada registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Registrar Compra (Entrada de Estoque)</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
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
              <Label>Adicionar Produto</Label>
              <Select onValueChange={addItem} value="">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (Estoque: {p.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {items.length > 0 && (
              <ScrollArea className="h-[250px] border rounded-md p-2">
                <div className="space-y-3">
                  {items.map((i) => (
                    <div
                      key={i.product.id}
                      className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{i.product.name}</p>
                        <p className="text-xs text-muted-foreground">Atual: {i.product.stock}</p>
                      </div>
                      <div className="w-24">
                        <Label className="text-xs">Qtd</Label>
                        <Input
                          type="number"
                          min="1"
                          value={i.quantity}
                          onChange={(e) =>
                            updateItem(i.product.id, 'quantity', Number(e.target.value))
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="w-32">
                        <Label className="text-xs">Custo (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={i.costPrice}
                          onChange={(e) =>
                            updateItem(i.product.id, 'costPrice', Number(e.target.value))
                          }
                          className="h-8"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive mt-4"
                        onClick={() => setItems(items.filter((x) => x.product.id !== i.product.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="font-semibold">Total a Pagar</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!supplierId || items.length === 0}>
              Confirmar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
