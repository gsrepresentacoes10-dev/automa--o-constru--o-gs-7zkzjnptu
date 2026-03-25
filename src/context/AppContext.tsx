import { createContext, useContext, useState, ReactNode } from 'react'
import { toast } from '@/hooks/use-toast'

export type Role = 'Admin' | 'Manager' | 'Seller'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface Seller {
  id: string
  code: string
  name: string
}

export type PaymentMethod =
  | 'Dinheiro'
  | 'PIX'
  | 'Cartão de Crédito'
  | 'Cartão de Débito'
  | 'Venda a Prazo'

export interface Product {
  id: string
  sku: string
  barcode?: string
  name: string
  category: string
  unit: string
  price: number
  costPrice: number
  stock: number
  minStock: number
}

export type MovementType = 'Entrada' | 'Saída'

export interface StockMovement {
  id: string
  productId: string
  date: string
  type: MovementType
  quantity: number
  origin: string
  balanceAfter: number
}

export interface Customer {
  id: string
  name: string
  document: string
  phone: string
  totalSpent: number
  cashbackBalance: number
}

export interface SaleItem {
  product: Product
  quantity: number
  total: number
}

export interface Sale {
  id: string
  date: string
  customerId?: string
  customer?: string
  items: SaleItem[]
  total: number
  discount?: number
  status: 'Pendente' | 'Pago' | 'Cancelado'
  cashbackEarned?: number
  cashbackUsed?: number
  paymentMethod?: PaymentMethod
  dueDate?: string
  sellerId?: string
  sellerName?: string
  sellerCode?: string
  whatsappReminder?: boolean
  whatsappReminderDate?: string
}

export interface PreSale {
  id: string
  date: string
  customerName: string
  items: SaleItem[]
  total: number
  discountType: 'percent' | 'fixed'
  discountValue: string
}

export interface Supplier {
  id: string
  name: string
  document: string
  contact: string
}

export interface PurchaseItem {
  product: Product
  quantity: number
  costPrice: number
}

export interface Purchase {
  id: string
  date: string
  supplierId: string
  supplierName?: string
  items: PurchaseItem[]
  total: number
}

export interface QuoteEditLog {
  timestamp: string
  userName: string
}

export interface Quote {
  id: string
  date: string
  validUntil?: string
  customerId?: string
  customer?: string
  items: SaleItem[]
  total: number
  discount?: number
  status: 'Pendente' | 'Aprovado' | 'Reprovado' | 'Convertido' | 'Cancelado'
  sellerId?: string
  sellerName?: string
  sellerCode?: string
  editHistory?: QuoteEditLog[]
  whatsappReminder?: boolean
  whatsappReminderDate?: string
}

interface AppContextType {
  role: Role
  setRole: (role: Role) => void
  currentUser: User
  users: User[]
  setUsers: (users: User[]) => void
  addUser: (user: Omit<User, 'id'>) => void
  deleteUser: (id: string) => void
  sellers: Seller[]
  addSeller: (seller: Omit<Seller, 'id'>) => void
  updateSeller: (id: string, seller: Omit<Seller, 'id'>) => void
  deleteSeller: (id: string) => void
  products: Product[]
  setProducts: (products: Product[]) => void
  addProduct: (product: Omit<Product, 'id'>) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
  stockMovements: StockMovement[]
  addManualStockAdjustment: (
    productId: string,
    type: MovementType,
    quantity: number,
    reason: string,
  ) => void
  sales: Sale[]
  setSales: (sales: Sale[]) => void
  addSale: (sale: Omit<Sale, 'id' | 'date' | 'status'>) => Sale
  updateSale: (id: string, saleData: Partial<Sale>) => void
  markSaleAsPaid: (id: string) => void
  preSales: PreSale[]
  addPreSale: (preSale: Omit<PreSale, 'id' | 'date'>) => void
  updatePreSale: (id: string, preSale: Omit<PreSale, 'id' | 'date'>) => void
  deletePreSale: (id: string) => void
  customers: Customer[]
  setCustomers: (customers: Customer[]) => void
  addCustomer: (customer: Omit<Customer, 'id' | 'totalSpent' | 'cashbackBalance'>) => void
  cashbackPercentage: number
  suppliers: Supplier[]
  setSuppliers: (suppliers: Supplier[]) => void
  purchases: Purchase[]
  addPurchase: (purchase: Omit<Purchase, 'id' | 'date'>) => void
  quotes: Quote[]
  addQuote: (quote: Omit<Quote, 'id' | 'date' | 'status'>) => void
  updateQuote: (id: string, quote: Partial<Quote>, logEdit?: boolean) => void
  duplicateQuote: (id: string) => Quote | null
  convertQuoteToSale: (quoteId: string, paymentMethod: PaymentMethod) => void
  convertQuoteToPreSale: (quoteId: string) => void
  processOnlinePayment: (type: 'quote' | 'sale', id: string, method: PaymentMethod) => void
}

const initialUsers: User[] = [
  { id: '1', name: 'Carlos Admin', email: 'carlos@construmaster.com', role: 'Admin' },
  { id: '2', name: 'Ana Gerente', email: 'ana@construmaster.com', role: 'Manager' },
  { id: '3', name: 'Pedro Vendedor', email: 'pedro@construmaster.com', role: 'Seller' },
]

const initialSellers: Seller[] = [
  { id: '1', code: 'V001', name: 'Pedro Vendedor' },
  { id: '2', code: 'V002', name: 'Ana Gerente' },
]

const initialProducts: Product[] = [
  {
    id: '1',
    sku: 'CIM-001',
    barcode: '7891000000001',
    name: 'Cimento CP II 50kg',
    category: 'Básico',
    unit: 'sc',
    price: 35.9,
    costPrice: 28.0,
    stock: 12,
    minStock: 50,
  },
  {
    id: '2',
    sku: 'TIJ-008',
    barcode: '7891000000002',
    name: 'Tijolo Baiano 8 Furos',
    category: 'Básico',
    unit: 'un',
    price: 1.15,
    costPrice: 0.8,
    stock: 5200,
    minStock: 1000,
  },
  {
    id: '3',
    sku: 'ARG-003',
    barcode: '7891000000003',
    name: 'Argamassa ACIII 20kg',
    category: 'Básico',
    unit: 'sc',
    price: 28.5,
    costPrice: 20.0,
    stock: 45,
    minStock: 30,
  },
  {
    id: '4',
    sku: 'POR-001',
    barcode: '7891000000004',
    name: 'Porcelanato Polido 60x60',
    category: 'Pisos',
    unit: 'm²',
    price: 59.9,
    costPrice: 40.0,
    stock: 150,
    minStock: 50,
  },
  {
    id: '5',
    sku: 'TUB-100',
    barcode: '7891000000005',
    name: 'Tubo PVC 100mm',
    category: 'Hidráulica',
    unit: 'br',
    price: 45.0,
    costPrice: 30.0,
    stock: 80,
    minStock: 20,
  },
  {
    id: '6',
    sku: 'CAB-004',
    barcode: '7891000000006',
    name: 'Cabo Flexível 4mm',
    category: 'Elétrica',
    unit: 'rl',
    price: 180.0,
    costPrice: 120.0,
    stock: 15,
    minStock: 10,
  },
  {
    id: '7',
    sku: 'TIN-018',
    barcode: '7891000000007',
    name: 'Tinta Acrílica Fosca 18L',
    category: 'Pintura',
    unit: 'lt',
    price: 220.0,
    costPrice: 160.0,
    stock: 8,
    minStock: 5,
  },
]

const initialStockMovements: StockMovement[] = initialProducts.map((p) => ({
  id: `MOV-INIT-${p.id}`,
  productId: p.id,
  date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  type: 'Entrada',
  quantity: p.stock,
  origin: 'Saldo Inicial',
  balanceAfter: p.stock,
}))

const initialCustomers: Customer[] = [
  {
    id: '1',
    name: 'Construtora Alpha Ltda',
    document: '12.345.678/0001-90',
    phone: '(11) 98765-4321',
    totalSpent: 45600.0,
    cashbackBalance: 125.5,
  },
  {
    id: '2',
    name: 'João Silva',
    document: '123.456.789-00',
    phone: '(11) 91234-5678',
    totalSpent: 3450.5,
    cashbackBalance: 45.0,
  },
]

const initialSales: Sale[] = [
  {
    id: 'V-1001',
    date: new Date().toISOString(),
    customerId: '2',
    customer: 'João Silva',
    items: [
      { product: initialProducts[0], quantity: 10, total: 359 },
      { product: initialProducts[1], quantity: 500, total: 575 },
    ],
    total: 934,
    status: 'Pago',
    paymentMethod: 'PIX',
    sellerId: '3',
    sellerName: 'Pedro Vendedor',
  },
  {
    id: 'V-1002',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    customerId: '1',
    customer: 'Construtora Alpha Ltda',
    items: [
      { product: initialProducts[3], quantity: 100, total: 5990 },
      { product: initialProducts[4], quantity: 20, total: 900 },
    ],
    total: 6890.0,
    status: 'Pendente',
    paymentMethod: 'Venda a Prazo',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sellerId: '3',
    sellerName: 'Pedro Vendedor',
    whatsappReminder: true,
    whatsappReminderDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'V-1003',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    customerId: '2',
    customer: 'João Silva',
    items: [
      { product: initialProducts[5], quantity: 2, total: 360 },
      { product: initialProducts[6], quantity: 1, total: 220 },
    ],
    total: 580,
    status: 'Pago',
    paymentMethod: 'Cartão de Crédito',
    sellerId: '2',
    sellerName: 'Ana Gerente',
  },
]

const initialPreSales: PreSale[] = [
  {
    id: 'PV-1001',
    date: new Date().toISOString(),
    customerName: 'Mestre de Obras Zé',
    items: [{ product: initialProducts[2], quantity: 15, total: 427.5 }],
    total: 427.5,
    discountType: 'percent',
    discountValue: '',
  },
]

const initialSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Votorantim Cimentos',
    document: '00.000.000/0001-91',
    contact: '(11) 4000-0000',
  },
]

const initialQuotes: Quote[] = [
  {
    id: 'ORC-1001',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    customerId: '1',
    customer: 'Construtora Alpha Ltda',
    items: [{ product: initialProducts[3], quantity: 50, total: 2995 }],
    total: 2995,
    status: 'Pendente',
    sellerId: '1',
    sellerCode: 'V001',
    sellerName: 'Pedro Vendedor',
    editHistory: [],
    whatsappReminder: true,
    whatsappReminderDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORC-1002',
    date: new Date().toISOString(),
    validUntil: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    customerId: '2',
    customer: 'João Silva',
    items: [{ product: initialProducts[5], quantity: 5, total: 225 }],
    total: 225,
    status: 'Aprovado',
    sellerId: '2',
    sellerCode: 'V002',
    sellerName: 'Ana Gerente',
    editHistory: [],
  },
]

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [role, setRole] = useState<Role>('Admin')
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0])
  const [sellers, setSellers] = useState<Seller[]>(initialSellers)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialStockMovements)
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [preSales, setPreSales] = useState<PreSale[]>(initialPreSales)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes)
  const cashbackPercentage = 2

  const handleSetRole = (newRole: Role) => {
    setRole(newRole)
    const matchedUser = users.find((u) => u.role === newRole)
    if (matchedUser) {
      setCurrentUser(matchedUser)
    }
  }

  const addUser = (newUser: Omit<User, 'id'>) => {
    setUsers([...users, { ...newUser, id: Date.now().toString() }])
    toast({ title: 'Usuário Adicionado', description: 'O acesso foi concedido com sucesso.' })
  }

  const deleteUser = (id: string) => {
    setUsers(users.filter((u) => u.id !== id))
    toast({ title: 'Usuário Removido', description: 'O acesso foi revogado.' })
  }

  const addSeller = (seller: Omit<Seller, 'id'>) => {
    const newSeller = { ...seller, id: Date.now().toString() }
    setSellers([...sellers, newSeller])
    toast({ title: 'Vendedor Cadastrado', description: 'Vendedor adicionado com sucesso.' })
  }

  const updateSeller = (id: string, seller: Omit<Seller, 'id'>) => {
    setSellers((prev) => prev.map((s) => (s.id === id ? { ...s, ...seller } : s)))
    toast({ title: 'Vendedor Atualizado', description: 'Vendedor atualizado com sucesso.' })
  }

  const deleteSeller = (id: string) => {
    setSellers((prev) => prev.filter((s) => s.id !== id))
    toast({ title: 'Vendedor Removido' })
  }

  const addProduct = (newProduct: Omit<Product, 'id'>) => {
    const product: Product = { ...newProduct, id: `PROD-${Date.now()}` }
    setProducts([...products, product])

    if (product.stock > 0) {
      const movement: StockMovement = {
        id: `MOV-${Date.now()}-${product.id}`,
        productId: product.id,
        date: new Date().toISOString(),
        type: 'Entrada',
        quantity: product.stock,
        origin: 'Cadastro Inicial',
        balanceAfter: product.stock,
      }
      setStockMovements((prev) => [movement, ...prev])
    }

    toast({ title: 'Produto Cadastrado', description: `${product.name} adicionado com sucesso.` })
  }

  const updateProduct = (id: string, productData: Partial<Product>) => {
    const product = products.find((p) => p.id === id)
    if (product && productData.stock !== undefined && productData.stock !== product.stock) {
      const newStock = productData.stock
      const type: MovementType = newStock > product.stock ? 'Entrada' : 'Saída'
      const qty = Math.abs(newStock - product.stock)
      const movement: StockMovement = {
        id: `MOV-${Date.now()}-${id}`,
        productId: id,
        date: new Date().toISOString(),
        type,
        quantity: qty,
        origin: 'Edição de Cadastro',
        balanceAfter: newStock,
      }
      setStockMovements((prev) => [movement, ...prev])
    }

    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...productData } : p)))
    toast({ title: 'Produto Atualizado', description: 'As alterações foram salvas.' })
  }

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    toast({ title: 'Produto Removido', description: 'Produto excluído do sistema.' })
  }

  const addManualStockAdjustment = (
    productId: string,
    type: MovementType,
    quantity: number,
    reason: string,
  ) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const newStock = type === 'Entrada' ? product.stock + quantity : product.stock - quantity
    if (newStock < 0) {
      toast({
        title: 'Aviso',
        description: 'O estoque não pode ficar negativo.',
        variant: 'destructive',
      })
      return
    }

    const movement: StockMovement = {
      id: `MOV-${Date.now()}`,
      productId,
      date: new Date().toISOString(),
      type,
      quantity,
      origin: `Ajuste Manual: ${reason}`,
      balanceAfter: newStock,
    }

    setStockMovements((prev) => [movement, ...prev])
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)))
    toast({ title: 'Estoque Ajustado', description: `Novo saldo: ${newStock}` })
  }

  const addCustomer = (newCustomer: Omit<Customer, 'id' | 'totalSpent' | 'cashbackBalance'>) => {
    const customer: Customer = {
      ...newCustomer,
      id: `CUST-${Date.now()}`,
      totalSpent: 0,
      cashbackBalance: 0,
    }
    setCustomers([customer, ...customers])
    toast({
      title: 'Cliente Cadastrado',
      description: 'Novo cliente adicionado com sucesso.',
    })
  }

  const addPreSale = (preSale: Omit<PreSale, 'id' | 'date'>) => {
    const newPreSale: PreSale = {
      ...preSale,
      id: `PV-${1000 + preSales.length + 1}`,
      date: new Date().toISOString(),
    }
    setPreSales([newPreSale, ...preSales])
  }

  const updatePreSale = (id: string, preSale: Omit<PreSale, 'id' | 'date'>) => {
    setPreSales((prev) => prev.map((p) => (p.id === id ? { ...p, ...preSale } : p)))
  }

  const deletePreSale = (id: string) => {
    setPreSales((prev) => prev.filter((p) => p.id !== id))
  }

  const addPurchase = (newPurchase: Omit<Purchase, 'id' | 'date'>) => {
    const purchase: Purchase = {
      ...newPurchase,
      id: `C-${1000 + purchases.length + 1}`,
      date: new Date().toISOString(),
    }
    setPurchases([purchase, ...purchases])

    const newMovements: StockMovement[] = []

    const updatedProducts = products.map((p) => {
      const pItem = newPurchase.items.find((item) => item.product.id === p.id)
      if (pItem) {
        const newStock = p.stock + pItem.quantity
        newMovements.push({
          id: `MOV-${Date.now()}-${p.id}`,
          productId: p.id,
          date: purchase.date,
          type: 'Entrada',
          quantity: pItem.quantity,
          origin: `Compra #${purchase.id}`,
          balanceAfter: newStock,
        })
        return { ...p, stock: newStock, costPrice: pItem.costPrice }
      }
      return p
    })

    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev])
    }

    setProducts(updatedProducts)

    toast({
      title: 'Entrada Registrada',
      description: 'Estoque atualizado com sucesso.',
    })
  }

  const addQuote = (newQuote: Omit<Quote, 'id' | 'date' | 'status'>) => {
    const quote: Quote = {
      ...newQuote,
      id: `ORC-${1000 + quotes.length + 1}`,
      date: new Date().toISOString(),
      status: 'Pendente',
      editHistory: [],
    }
    setQuotes([quote, ...quotes])
    toast({ title: 'Orçamento Salvo', description: `Orçamento ${quote.id} criado com sucesso.` })
  }

  const updateQuote = (id: string, updatedQuote: Partial<Quote>, logEdit: boolean = false) => {
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const newHistory = [...(q.editHistory || [])]
          if (logEdit) {
            newHistory.push({
              timestamp: new Date().toISOString(),
              userName: currentUser.name,
            })
          }
          return { ...q, ...updatedQuote, editHistory: newHistory }
        }
        return q
      }),
    )
    toast({ title: 'Orçamento Atualizado', description: `Orçamento ${id} atualizado com sucesso.` })
  }

  const duplicateQuote = (id: string): Quote | null => {
    const quote = quotes.find((q) => q.id === id)
    if (!quote) return null

    const newQuote: Quote = {
      ...quote,
      id: `ORC-${1000 + quotes.length + 1}`,
      date: new Date().toISOString(),
      status: 'Pendente',
      editHistory: [],
    }

    setQuotes([newQuote, ...quotes])
    toast({
      title: 'Orçamento Duplicado',
      description: `Novo orçamento ${newQuote.id} criado com sucesso.`,
    })
    return newQuote
  }

  const convertQuoteToSale = (quoteId: string, paymentMethod: PaymentMethod) => {
    const quote = quotes.find((q) => q.id === quoteId)
    if (!quote || quote.status === 'Convertido' || quote.status === 'Cancelado') return

    setQuotes((prev) => prev.map((q) => (q.id === quoteId ? { ...q, status: 'Convertido' } : q)))

    addSale({
      customerId: quote.customerId,
      customer: quote.customer,
      items: quote.items,
      total: quote.total,
      discount: quote.discount,
      paymentMethod,
      sellerId: quote.sellerId,
      sellerName: quote.sellerName,
      sellerCode: quote.sellerCode,
    })
    toast({
      title: 'Orçamento Convertido',
      description: 'O orçamento foi convertido em venda e o estoque foi atualizado.',
    })
  }

  const convertQuoteToPreSale = (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId)
    if (!quote || quote.status === 'Convertido' || quote.status === 'Cancelado') return

    setQuotes((prev) => prev.map((q) => (q.id === quoteId ? { ...q, status: 'Convertido' } : q)))

    addPreSale({
      customerName: quote.customer || 'Consumidor Final',
      items: quote.items,
      total: quote.total,
      discountType: 'fixed',
      discountValue: quote.discount ? quote.discount.toString() : '',
    })

    toast({
      title: 'Pré-venda Criada',
      description: 'Orçamento convertido para pré-venda com sucesso.',
    })
  }

  const addSale = (newSale: Omit<Sale, 'id' | 'date' | 'status'>): Sale => {
    const isCredit = newSale.paymentMethod === 'Venda a Prazo'
    const sale: Sale = {
      ...newSale,
      id: `V-${1000 + sales.length + 1}`,
      date: new Date().toISOString(),
      status: isCredit ? 'Pendente' : 'Pago',
      dueDate: isCredit ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    }

    if (!sale.sellerId && !sale.sellerName) {
      sale.sellerId = currentUser.id
      sale.sellerName = currentUser.name
    }

    setSales([sale, ...sales])

    const newMovements: StockMovement[] = []

    const updatedProducts = products.map((p) => {
      const soldItem = newSale.items.find((item) => item.product.id === p.id)
      if (soldItem) {
        const newStock = p.stock - soldItem.quantity

        newMovements.push({
          id: `MOV-${Date.now()}-${p.id}`,
          productId: p.id,
          date: sale.date,
          type: 'Saída',
          quantity: soldItem.quantity,
          origin: `Venda #${sale.id}`,
          balanceAfter: newStock,
        })

        if (newStock <= p.minStock && p.stock > p.minStock) {
          setTimeout(() => {
            toast({
              title: 'Alerta de Estoque: Email Enviado',
              description: `O produto ${p.name} atingiu o estoque mínimo de ${p.minStock}. O setor de compras foi notificado.`,
              variant: 'destructive',
            })
          }, 500)
        }
        return { ...p, stock: newStock }
      }
      return p
    })

    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev])
    }

    setProducts(updatedProducts)

    if (sale.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === sale.customerId) {
            return {
              ...c,
              totalSpent: c.totalSpent + sale.total,
              cashbackBalance:
                c.cashbackBalance - (sale.cashbackUsed || 0) + (sale.cashbackEarned || 0),
            }
          }
          return c
        }),
      )
    }

    return sale
  }

  const updateSale = (id: string, saleData: Partial<Sale>) => {
    setSales((prev) => prev.map((s) => (s.id === id ? { ...s, ...saleData } : s)))
  }

  const markSaleAsPaid = (id: string) => {
    setSales((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'Pago' } : s)))
  }

  const processOnlinePayment = (type: 'quote' | 'sale', id: string, method: PaymentMethod) => {
    if (type === 'quote') {
      const quote = quotes.find((q) => q.id === id)
      if (!quote) return
      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'Aprovado' } : q)))
      addSale({
        customerId: quote.customerId,
        customer: quote.customer,
        items: quote.items,
        total: quote.total,
        discount: quote.discount,
        paymentMethod: method,
        sellerId: quote.sellerId,
        sellerName: quote.sellerName,
        sellerCode: quote.sellerCode,
      })
    } else if (type === 'sale') {
      setSales((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'Pago', paymentMethod: method } : s)),
      )
    }
  }

  return (
    <AppContext.Provider
      value={{
        role,
        setRole: handleSetRole,
        currentUser,
        users,
        setUsers,
        addUser,
        deleteUser,
        sellers,
        addSeller,
        updateSeller,
        deleteSeller,
        products,
        setProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        stockMovements,
        addManualStockAdjustment,
        sales,
        setSales,
        addSale,
        updateSale,
        markSaleAsPaid,
        preSales,
        addPreSale,
        updatePreSale,
        deletePreSale,
        customers,
        setCustomers,
        addCustomer,
        cashbackPercentage,
        suppliers,
        setSuppliers,
        purchases,
        addPurchase,
        quotes,
        addQuote,
        updateQuote,
        duplicateQuote,
        convertQuoteToSale,
        convertQuoteToPreSale,
        processOnlinePayment,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
