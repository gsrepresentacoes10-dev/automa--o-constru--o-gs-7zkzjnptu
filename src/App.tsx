import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/context/AppContext'
import Layout from './components/Layout'
import Index from './pages/Index'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'
import Invoices from './pages/Invoices'
import Customers from './pages/Customers'
import Staff from './pages/Staff'
import Reports from './pages/Reports'
import Receivables from './pages/Receivables'
import Suppliers from './pages/Suppliers'
import Purchases from './pages/Purchases'
import Quotes from './pages/Quotes'
import SellerPerformance from './pages/SellerPerformance'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/estoque" element={<Inventory />} />
            <Route path="/vendas" element={<Sales />} />
            <Route path="/orcamentos" element={<Quotes />} />
            <Route path="/compras" element={<Purchases />} />
            <Route path="/fornecedores" element={<Suppliers />} />
            <Route path="/notas-fiscais" element={<Invoices />} />
            <Route path="/clientes" element={<Customers />} />
            <Route path="/colaboradores" element={<Staff />} />
            <Route path="/desempenho" element={<SellerPerformance />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/contas-receber" element={<Receivables />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AppProvider>
  </BrowserRouter>
)

export default App
