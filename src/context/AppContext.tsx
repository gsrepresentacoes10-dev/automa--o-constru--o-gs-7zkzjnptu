import { createContext, useContext, useState, ReactNode } from 'react'
import { toast } from '@/hooks/use-toast'

export type Role = 'Admin' | 'Vendedor' | 'Estoquista'

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
  products: Product[]
  setProducts: (products: Product[]) => void
  sales: Sale[]
  setSales: (sales: Sale[]) => void
  addSale: (sale: Omit<Sale, 'id' | 'date' | 'status'>) => Sale
  markSaleAsPaid: (id: string) => void
  customers: Customer[]
  setCustomers: (customers: Customer[]) => void
  cashbackPercentage: number
  suppliers: Supplier[]
  setSuppliers: (suppliers: Supplier[]) => void
  purchases: Purchase[]
  addPurchase: (purchase: Omit<Purchase, 'id' | 'date'>) => void
  quotes: Quote[]
  addQuote: (quote: Omit<Quote, 'id' | 'date' | 'status'>) => void
  convertQuoteToSale: (quoteId: string, paymentMethod: PaymentMethod) => void
}

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
    items: [],
    total: 1450.5,
    status: 'Pago',
    cashbackEarned: 29.01,
    paymentMethod: 'PIX',
  },
  {
    id: 'V-1002',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    customerId: '1',
    customer: 'Construtora Alpha Ltda',
    items: [],
    total: 5800.0,
    status: 'Pendente',
    paymentMethod: 'Venda a Prazo',
    dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
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

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('Admin')
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const cashbackPercentage = 2

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
    if (!quote) return

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

  const addSale = (newSale: Omit<Sale, 'id' | 'date' | 'status'>): Sale => {
    const isCredit = newSale.paymentMethod === 'Venda a Prazo'
    const sale: Sale = {
      ...newSale,
      id: `V-${1000 + sales.length + 1}`,
      date: new Date().toISOString(),
      status: isCredit ? 'Pendente' : 'Pago',
      dueDate: isCredit ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
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
        setRole,
        products,
        setProducts,
        sales,
        setSales,
        addSale,
        markSaleAsPaid,
        customers,
        setCustomers,
        cashbackPercentage,
        suppliers,
        setSuppliers,
        purchases,
        addPurchase,
        quotes,
        addQuote,
        convertQuoteToSale,
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
