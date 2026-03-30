import { useState } from 'react'
import { Outlet, useLocation, Link, Navigate } from 'react-router-dom'
import { Bell, Search, UserCircle, Menu, PackageOpen } from 'lucide-react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppContext, Role } from '@/context/AppContext'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Layout() {
  const location = useLocation()
  const {
    isAuthenticated,
    currentUser,
    role,
    logout,
    products,
    maxDiscountPercentage,
    setMaxDiscountPercentage,
  } = useAppContext()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [tempMaxDiscount, setTempMaxDiscount] = useState(maxDiscountPercentage)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock)
  const lowStockCount = lowStockProducts.length

  return (
    <SidebarProvider>
      <style>{`
        @media print {
          body.printing-thermal * {
            visibility: hidden;
            color: #000 !important;
          }
          body.printing-thermal .thermal-receipt,
          body.printing-thermal .thermal-receipt * {
            visibility: visible;
          }
          body.printing-thermal .thermal-dialog-content {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            transform: none !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: white !important;
          }
          body.printing-thermal .thermal-receipt {
            width: 80mm;
            margin: 0;
            padding: 0;
          }
          body.printing-thermal .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
      <div className="print:hidden h-full flex flex-col">
        <AppSidebar />
      </div>
      <SidebarInset className="flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 shadow-sm z-10 print:hidden">
          <div className="flex items-center gap-2 flex-1">
            <SidebarTrigger />
            <div className="hidden md:flex relative max-w-md w-full ml-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar produtos, vendas, clientes..."
                className="w-full bg-muted/50 pl-9 border-none focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {lowStockCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                      {lowStockCount > 9 ? '9+' : lowStockCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                  <h4 className="font-semibold text-sm">Central de Notificações</h4>
                  <Badge variant="destructive">{lowStockCount} alertas</Badge>
                </div>
                <ScrollArea className="h-72">
                  {lowStockProducts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                      <PackageOpen className="h-8 w-8 mb-3 opacity-20" />
                      Nenhuma notificação no momento.
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {lowStockProducts.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 bg-destructive/5 rounded-md border border-destructive/10 text-sm flex flex-col gap-1"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-foreground leading-tight">
                              {p.name}
                            </span>
                            <span className="text-xs font-bold text-destructive whitespace-nowrap">
                              {p.stock} {p.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              Mín: {p.minStock} {p.unit}
                            </span>
                            <Link
                              to="/compras"
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              Repor Estoque
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {role.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Perfil atual:{' '}
                      <Badge variant="outline" className="ml-1 text-xs">
                        {role === 'Admin'
                          ? 'Administrador'
                          : role === 'Manager'
                            ? 'Gerente'
                            : 'Usuário Comum'}
                      </Badge>
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {role === 'Admin' && (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setTempMaxDiscount(maxDiscountPercentage)
                        setIsSettingsOpen(true)
                      }}
                    >
                      Configurações do Sistema
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  Sair do Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main
          className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6 print:bg-transparent print:p-0 print:overflow-visible"
          key={location.pathname}
        >
          <div className="animate-slide-in-right h-full print:animate-none">
            {role === 'Seller' &&
            [
              '/estoque',
              '/compras',
              '/historico-compras',
              '/desempenho',
              '/relatorios',
              '/fluxo-caixa',
              '/contas-receber',
              '/contas-a-pagar',
              '/fornecedores',
              '/vendedores',
              '/clientes',
              '/colaboradores',
            ].some((p) => location.pathname.startsWith(p)) ? (
              <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-4">
                <div className="bg-destructive/10 p-4 rounded-full">
                  <UserCircle className="h-12 w-12 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
                <p className="text-muted-foreground">
                  O seu perfil de Usuário Comum não tem permissão para acessar esta área.
                </p>
                <Button asChild className="mt-4">
                  <Link to="/vendas">Ir para Vendas</Link>
                </Button>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </SidebarInset>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Configurações do Sistema</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Desconto Máximo Permitido (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={tempMaxDiscount}
                onChange={(e) => setTempMaxDiscount(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Vendas com desconto superior a este valor exigirão senha de liberação do
                Gerente/Admin no momento do checkout.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setMaxDiscountPercentage(tempMaxDiscount)
                setIsSettingsOpen(false)
              }}
            >
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
