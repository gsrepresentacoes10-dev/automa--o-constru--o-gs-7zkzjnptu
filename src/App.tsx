import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/context/AppContext'
import Layout from './components/Layout'
import Index from './pages/Index'
import Inventory from './pages/Inventory'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Invoices from './pages/Invoices'
import Customers from './pages/Customers'
import Staff from './pages/Staff'
import Reports from './pages/Reports'
import Receivables from './pages/Receivables'
import Payables from './pages/Payables'
import Suppliers from './pages/Suppliers'
import Purchases from './pages/Purchases'
import PurchaseHistory from './pages/PurchaseHistory'
import Quotes from './pages/Quotes'
import Sellers from './pages/Sellers'
import SellerPerformance from './pages/SellerPerformance'
import Checkout from './pages/Checkout'
import NotFound from './pages/NotFound'
import CashFlow from './pages/CashFlow'
import SalesSearch from './pages/SalesSearch'
import Login from './pages/Login'
import Register from './pages/Register'
import MyStatement from './pages/MyStatement'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import AccessLogs from './pages/AccessLogs'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/checkout/:type/:id" element={<Checkout />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/logs-acesso" element={<AccessLogs />} />
            <Route path="/meu-extrato" element={<MyStatement />} />
            <Route path="/estoque" element={<Inventory />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/vendas" element={<Sales />} />
            <Route path="/pesquisa-vendas" element={<SalesSearch />} />
            <Route path="/orcamentos" element={<Quotes />} />
            <Route path="/compras" element={<Purchases />} />
            <Route path="/historico-compras" element={<PurchaseHistory />} />
            <Route path="/fornecedores" element={<Suppliers />} />
            <Route path="/notas-fiscais" element={<Invoices />} />
            <Route path="/clientes" element={<Customers />} />
            <Route path="/vendedores" element={<Sellers />} />
            <Route path="/colaboradores" element={<Staff />} />
            <Route path="/desempenho" element={<SellerPerformance />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/fluxo-caixa" element={<CashFlow />} />
            <Route path="/contas-receber" element={<Receivables />} />
            <Route path="/contas-a-pagar" element={<Payables />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AppProvider>
  </BrowserRouter>
)

export default App
