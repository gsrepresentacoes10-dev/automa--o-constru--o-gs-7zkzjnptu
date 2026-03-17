import { createContext, useContext, useState, ReactNode } from 'react'

export type Role = 'Admin' | 'Vendedor' | 'Estoquista'

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
  status: 'Pendente' | 'Pago' | 'Cancelado'
  cashbackEarned?: number
  cashbackUsed?: number
}

interface AppContextType {
  role: Role
  setRole: (role: Role) => void
  products: Product[]
  setProducts: (products: Product[]) => void
  sales: Sale[]
  setSales: (sales: Sale[]) => void
  addSale: (sale: Omit<Sale, 'id' | 'date' | 'status'>) => Sale
  customers: Customer[]
  setCustomers: (customers: Customer[]) => void
  cashbackPercentage: number
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
  {
    id: '3',
    name: 'Maria Souza',
    document: '987.654.321-11',
    phone: '(11) 99876-5432',
    totalSpent: 890.0,
    cashbackBalance: 0,
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
  },
]

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('Admin')
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const cashbackPercentage = 2 // 2% cashback system-wide

  const addSale = (newSale: Omit<Sale, 'id' | 'date' | 'status'>): Sale => {
    const sale: Sale = {
      ...newSale,
      id: `V-${1000 + sales.length + 1}`,
      date: new Date().toISOString(),
      status: 'Pago',
    }
    setSales([sale, ...sales])

    // Update stock
    const updatedProducts = products.map((p) => {
      const soldItem = newSale.items.find((item) => item.product.id === p.id)
      if (soldItem) {
        return { ...p, stock: p.stock - soldItem.quantity }
      }
      return p
    })
    setProducts(updatedProducts)

    // Update Customer Cashback and Total Spent
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
        customers,
        setCustomers,
        cashbackPercentage,
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
