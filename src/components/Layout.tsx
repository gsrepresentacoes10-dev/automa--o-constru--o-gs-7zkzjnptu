import { Outlet, useLocation } from 'react-router-dom'
import { Bell, Search, UserCircle, Menu } from 'lucide-react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

export default function Layout() {
  const location = useLocation()
  const { role, setRole, products } = useAppContext()

  const lowStockCount = products.filter((p) => p.stock < p.minStock).length

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
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {lowStockCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>

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
                    <p className="text-sm font-medium leading-none">Usuário Demo</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Perfil atual:{' '}
                      <Badge variant="outline" className="ml-1 text-xs">
                        {role}
                      </Badge>
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Mudar Visão (Simulação)
                </DropdownMenuLabel>
                {(['Admin', 'Manager', 'Seller'] as Role[]).map((r) => (
                  <DropdownMenuItem key={r} onClick={() => setRole(r)} className="cursor-pointer">
                    Visão {r}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
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
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
