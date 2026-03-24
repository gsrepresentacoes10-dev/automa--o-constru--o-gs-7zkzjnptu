import { createContext, useContext, useState, ReactNode } from 'react'
import { toast } from '@/hooks/use-toast'

export type Role = 'Admin' | 'Manager' | 'Seller'

export interface User {
  id: string
  name: string
  email: string
  role: Role
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
  name: string
  category: string
  unit: string
  price: number
  costPrice: number
  stock: number
  minStock: number
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

export interface Quote {
  id: string
  date: string
  validUntil?: string
  customerId?: string
  customer?: string
  items: SaleItem[]
  total: number
  discount?: number
  status: 'Pendente' | 'Convertido' | 'Cancelado'
}

interface AppContextType {
  role: Role
  setRole: (role: Role) => void
  currentUser: User
  users: User[]
  setUsers: (users: User[]) => void
  addUser: (user: Omit<User, 'id'>) => void
  deleteUser: (id: string) => void
  products: Product[]
  setProducts: (products: Product[]) => void
  sales: Sale[]
  setSales: (sales: Sale[]) => void
  addSale: (sale: Omit<Sale, 'id' | 'date' | 'status' | 'sellerId' | 'sellerName'>) => Sale
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
  convertQuoteToSale: (quoteId: string, paymentMethod: PaymentMethod) => void
  convertQuoteToPreSale: (quoteId: string) => void
}

const initialUsers: User[] = [
  { id: '1', name: 'Carlos Admin', email: 'carlos@construmaster.com', role: 'Admin' },
  { id: '2', name: 'Ana Gerente', email: 'ana@construmaster.com', role: 'Manager' },
  { id: '3', name: 'Pedro Vendedor', email: 'pedro@construmaster.com', role: 'Seller' },
]

const initialProducts: Product[] = [
  {
    id: '1',
    sku: 'CIM-001',
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
    name: 'Tinta Acrílica Fosca 18L',
    category: 'Pintura',
    unit: 'lt',
    price: 220.0,
    costPrice: 160.0,
    stock: 8,
    minStock: 5,
  },
]

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
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Atrasado para teste
    sellerId: '3',
    sellerName: 'Pedro Vendedor',
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
    validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Expired
    customerId: '1',
    customer: 'Construtora Alpha Ltda',
    items: [{ product: initialProducts[3], quantity: 50, total: 2995 }],
    total: 2995,
    status: 'Pendente',
  },
  {
    id: 'ORC-1002',
    date: new Date().toISOString(),
    validUntil: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Near Expiration
    customerId: '2',
    customer: 'João Silva',
    items: [{ product: initialProducts[5], quantity: 5, total: 225 }],
    total: 225,
    status: 'Pendente',
  },
]

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [role, setRole] = useState<Role>('Admin')
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0])
  const [products, setProducts] = useState<Product[]>(initialProducts)
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

    const updatedProducts = products.map((p) => {
      const pItem = newPurchase.items.find((item) => item.product.id === p.id)
      if (pItem) {
        return { ...p, stock: p.stock + pItem.quantity, costPrice: pItem.costPrice }
      }
      return p
    })
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
    }
    setQuotes([quote, ...quotes])
    toast({ title: 'Orçamento Salvo', description: `Orçamento ${quote.id} criado com sucesso.` })
  }

  const convertQuoteToSale = (quoteId: string, paymentMethod: PaymentMethod) => {
    const quote = quotes.find((q) => q.id === quoteId)
    if (!quote || quote.status !== 'Pendente') return

    setQuotes((prev) => prev.map((q) => (q.id === quoteId ? { ...q, status: 'Convertido' } : q)))

    addSale({
      customerId: quote.customerId,
      customer: quote.customer,
      items: quote.items,
      total: quote.total,
      discount: quote.discount,
      paymentMethod,
    })
    toast({
      title: 'Orçamento Convertido',
      description: 'O orçamento foi convertido em venda e o estoque foi atualizado.',
    })
  }

  const convertQuoteToPreSale = (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId)
    if (!quote || quote.status !== 'Pendente') return

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

  const addSale = (
    newSale: Omit<Sale, 'id' | 'date' | 'status' | 'sellerId' | 'sellerName'>,
  ): Sale => {
    const isCredit = newSale.paymentMethod === 'Venda a Prazo'
    const sale: Sale = {
      ...newSale,
      id: `V-${1000 + sales.length + 1}`,
      date: new Date().toISOString(),
      status: isCredit ? 'Pendente' : 'Pago',
      dueDate: isCredit ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
    }
    setSales([sale, ...sales])

    const updatedProducts = products.map((p) => {
      const soldItem = newSale.items.find((item) => item.product.id === p.id)
      if (soldItem) {
        const newStock = p.stock - soldItem.quantity
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

  const markSaleAsPaid = (id: string) => {
    setSales((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'Pago' } : s)))
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
        products,
        setProducts,
        sales,
        setSales,
        addSale,
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
        convertQuoteToSale,
        convertQuoteToPreSale,
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
