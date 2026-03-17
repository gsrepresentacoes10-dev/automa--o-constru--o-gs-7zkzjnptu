import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ReceiptText,
  Users,
  UserCog,
  BarChart3,
  HardHat,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAppContext } from '@/context/AppContext'

const allItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
    roles: ['Admin', 'Vendedor', 'Estoquista'],
  },
  { title: 'PDV / Vendas', url: '/vendas', icon: ShoppingCart, roles: ['Admin', 'Vendedor'] },
  { title: 'Estoque', url: '/estoque', icon: Package, roles: ['Admin', 'Estoquista'] },
  { title: 'Notas Fiscais', url: '/notas-fiscais', icon: ReceiptText, roles: ['Admin'] },
  { title: 'Clientes', url: '/clientes', icon: Users, roles: ['Admin', 'Vendedor'] },
  { title: 'Colaboradores', url: '/colaboradores', icon: UserCog, roles: ['Admin'] },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3, roles: ['Admin'] },
]

export function AppSidebar() {
  const location = useLocation()
  const { role } = useAppContext()

  const menuItems = allItems.filter((item) => item.roles.includes(role))

  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex flex-row items-center gap-2">
        <div className="bg-primary p-1.5 rounded-lg">
          <HardHat className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
          ConstruMaster
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
