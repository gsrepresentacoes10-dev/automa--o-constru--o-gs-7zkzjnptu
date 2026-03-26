import { useState } from 'react'
import { useAppContext, Product } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm)),
  )

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const productData = {
      sku: formData.get('sku') as string,
      barcode: formData.get('barcode') as string,
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      unit: formData.get('unit') as string,
      price: Number(formData.get('price')),
      costPrice: Number(formData.get('costPrice')),
      stock: Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')),
      isEssential: formData.get('isEssential') === 'on',
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, productData)
    } else {
      addProduct(productData)
    }
    setIsFormOpen(false)
  }

  const openNew = () => {
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastro de Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie o catálogo de produtos e informações fiscais/códigos.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, SKU ou Código..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome e Identificação</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preço de Venda</TableHead>
                <TableHead className="text-center">Estoque Atual</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {product.name}
                      {product.isEssential && (
                        <Badge
                          variant="destructive"
                          className="h-4 px-1 py-0 text-[9px] bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                        >
                          Essencial
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                        SKU: {product.sku}
                      </Badge>
                      {product.barcode && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 bg-muted font-normal text-muted-foreground border-transparent"
                        >
                          EAN: {product.barcode}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(product.price)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {product.stock}{' '}
                    <span className="text-muted-foreground text-xs">{product.unit}</span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 w-8"
                      onClick={() => openEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado no cadastro.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome do Produto <span className="text-destructive">*</span>
                </Label>
                <Input id="name" name="name" required defaultValue={editingProduct?.name} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Código de Barras</Label>
                  <Input
                    id="barcode"
                    name="barcode"
                    defaultValue={editingProduct?.barcode}
                    placeholder="EAN / GTIN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">
                    SKU / Ref. Interna <span className="text-destructive">*</span>
                  </Label>
                  <Input id="sku" name="sku" required defaultValue={editingProduct?.sku} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Categoria <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="category"
                    name="category"
                    placeholder="Ex: Básico"
                    required
                    defaultValue={editingProduct?.category}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">
                    Unidade de Medida <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="unit"
                    name="unit"
                    placeholder="un, kg, m²"
                    required
                    defaultValue={editingProduct?.unit}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">
                    Preço de Custo (R$) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="costPrice"
                    name="costPrice"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={editingProduct?.costPrice}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Preço de Venda (R$) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={editingProduct?.price}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border border-border/50">
                <div className="space-y-2">
                  <Label htmlFor="stock">
                    Estoque Inicial <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    required
                    defaultValue={editingProduct?.stock ?? 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">
                    Estoque Mínimo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="minStock"
                    name="minStock"
                    type="number"
                    required
                    defaultValue={editingProduct?.minStock ?? 5}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between border rounded-md p-3 bg-background mt-1">
                  <div className="space-y-0.5">
                    <Label htmlFor="isEssential" className="text-sm font-medium">
                      Produto Essencial
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Receba alertas push (notificações) quando o estoque chegar a zero.
                    </p>
                  </div>
                  <Switch
                    id="isEssential"
                    name="isEssential"
                    defaultChecked={!!editingProduct?.isEssential}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Salvar Produto</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
