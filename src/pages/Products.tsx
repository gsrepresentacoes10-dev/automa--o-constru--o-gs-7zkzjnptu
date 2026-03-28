import { useState } from 'react'
import { useAppContext, Product } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Pencil, Eye } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProductForm } from '@/components/products/ProductForm'

export default function Products() {
  const { products, addProduct, updateProduct, role } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const isSeller = role === 'Seller'

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleSave = (data: any) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data)
    } else {
      addProduct({ ...data, isEssential: data.stock === 0 ? false : undefined })
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
            Gerencie o catálogo, preços e integração com comissões de vendas.
          </p>
        </div>
        {!isSeller && (
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
        )}
      </div>

      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/20 flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, SKU, Código ou Ref..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setSearchTerm(searchTerm)}>
            Buscar
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria / Marca</TableHead>
                <TableHead className="text-right">Preço Base (Venda)</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium text-sm flex items-center gap-3">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="w-10 h-10 rounded-md object-cover border bg-muted"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md border bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">
                          Sem img
                        </div>
                      )}
                      <div>
                        {product.name}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 font-normal"
                          >
                            SKU: {product.sku || 'N/A'}
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
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{product.category}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{product.brand}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    {formatCurrency(product.price)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {product.manageStock ? (
                      <>
                        <span
                          className={
                            product.stock <= product.minStock ? 'text-destructive font-bold' : ''
                          }
                        >
                          {product.stock}
                        </span>{' '}
                        <span className="text-muted-foreground text-xs">{product.unit}</span>
                      </>
                    ) : (
                      <Badge variant="secondary" className="font-normal text-[10px]">
                        Não Gerenciado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(product)}
                    >
                      {isSeller ? (
                        <Eye className="h-4 w-4 text-primary" />
                      ) : (
                        <Pencil className="h-4 w-4 text-amber-600" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] p-4 sm:p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl">
              {editingProduct
                ? isSeller
                  ? 'Visualizar Produto'
                  : 'Editar Produto'
                : 'Adicionar Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          {isFormOpen && (
            <ProductForm
              product={editingProduct}
              onSave={handleSave}
              onCancel={() => setIsFormOpen(false)}
              readOnly={isSeller}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
