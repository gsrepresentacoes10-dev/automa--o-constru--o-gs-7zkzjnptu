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

export interface SaleItem {
  product: Product
  quantity: number
  total: number
}

export interface Sale {
  id: string
  date: string
  customer?: string
  items: SaleItem[]
  total: number
  status: 'Pendente' | 'Pago' | 'Cancelado'
}

interface AppContextType {
  role: Role
  setRole: (role: Role) => void
  products: Product[]
  setProducts: (products: Product[]) => void
  sales: Sale[]
  setSales: (sales: Sale[]) => void
  addSale: (sale: Omit<Sale, 'id' | 'date' | 'status'>) => void
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
  {
    id: '4',
    sku: 'PVC-100',
    name: 'Tubo PVC 100mm',
    category: 'Hidráulica',
    unit: 'un',
    price: 42.0,
    costPrice: 25.0,
    stock: 80,
    minStock: 50,
  },
  {
    id: '5',
    sku: 'FIO-250',
    name: 'Fio Flexível 2.5mm 100m',
    category: 'Elétrica',
    unit: 'rl',
    price: 185.0,
    costPrice: 130.0,
    stock: 4,
    minStock: 10,
  },
  {
    id: '6',
    sku: 'TIN-018',
    name: 'Tinta Acrílica Branca 18L',
    category: 'Pintura',
    unit: 'lt',
    price: 259.9,
    costPrice: 190.0,
    stock: 15,
    minStock: 10,
  },
]

const initialSales: Sale[] = [
  {
    id: 'V-1001',
    date: new Date().toISOString(),
    customer: 'João Silva',
    items: [],
    total: 1450.5,
    status: 'Pago',
  },
  {
    id: 'V-1002',
    date: new Date(Date.now() - 86400000).toISOString(),
    customer: 'Maria Souza',
    items: [],
    total: 320.0,
    status: 'Pago',
  },
  {
    id: 'V-1003',
    date: new Date(Date.now() - 172800000).toISOString(),
    items: [],
    total: 85.9,
    status: 'Pendente',
  },
]

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('Admin')
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [sales, setSales] = useState<Sale[]>(initialSales)

  const addSale = (newSale: Omit<Sale, 'id' | 'date' | 'status'>) => {
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
  }

  return (
    <AppContext.Provider value={{ role, setRole, products, setProducts, sales, setSales, addSale }}>
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
