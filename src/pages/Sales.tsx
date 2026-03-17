import { useState } from 'react'
import { useAppContext, Product, SaleItem } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Search, ShoppingCart, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Sales() {
  const { products, addSale } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<SaleItem[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')

  const filteredProducts = products.filter(
    (p) =>
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
      p.stock > 0,
  )

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast({ variant: 'destructive', title: 'Estoque insuficiente' })
          return prev
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * product.price }
            : item,
        )
      }
      return [...prev, { product, quantity: 1, total: product.price }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0)

  const handleCheckout = () => {
    addSale({
      customer: customerName || undefined,
      items: cart,
      total: cartTotal,
    })
    setCart([])
    setCustomerName('')
    setIsCheckoutOpen(false)
    toast({
      title: 'Venda finalizada!',
      description: 'Nota fiscal sendo processada.',
      className: 'bg-emerald-500 text-white border-none',
    })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)]">
      {/* Left Panel: Product Search */}
      <div className="flex-1 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PDV (Ponto de Venda)</h1>
          <p className="text-muted-foreground">Busque produtos e adicione ao carrinho.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por código de barras, SKU ou nome..."
            className="pl-10 h-12 text-lg shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        <ScrollArea className="flex-1 bg-card border rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border p-3 rounded-lg hover:border-primary cursor-pointer transition-colors flex flex-col justify-between"
                onClick={() => addToCart(product)}
              >
                <div>
                  <p className="font-semibold text-sm leading-tight mb-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Estoque: {product.stock} {product.unit}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-primary">{formatCurrency(product.price)}</span>
                  <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                Nenhum produto encontrado com estoque disponível.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel: Cart */}
      <Card className="w-full lg:w-[400px] flex flex-col shadow-md">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrinho Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                <p>O carrinho está vazio</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-start border-b pb-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm leading-tight">{item.product.name}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.quantity} {item.product.unit} x {formatCurrency(item.product.price)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-2">
                      <span className="font-bold text-sm">{formatCurrency(item.total)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex-col gap-4 border-t p-4 bg-muted/10">
          <div className="w-full flex justify-between items-center text-lg">
            <span className="font-semibold text-muted-foreground">Total</span>
            <span className="font-bold text-2xl text-primary">{formatCurrency(cartTotal)}</span>
          </div>
          <Button
            className="w-full h-12 text-lg font-bold"
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
          >
            Avançar para Pagamento
          </Button>
        </CardFooter>
      </Card>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Cliente (Opcional)</Label>
              <Input
                placeholder="Consumidor Final"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select defaultValue="pix">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit">Cartão de Débito</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted p-4 rounded-lg mt-2 flex justify-between items-center">
              <span className="font-medium">Valor Total:</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(cartTotal)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Voltar
            </Button>
            <Button onClick={handleCheckout} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
