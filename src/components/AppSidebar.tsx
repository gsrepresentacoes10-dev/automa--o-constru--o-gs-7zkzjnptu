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
  Landmark,
  FileText,
  ShoppingBag,
  Truck,
  TrendingUp,
  Tags,
  Boxes,
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

const menuSections = [
  {
    label: 'Menu Principal',
    items: [
      { title: 'Dashboard (BI)', url: '/', icon: LayoutDashboard, roles: ['Admin', 'Manager'] },
      {
        title: 'PDV / Vendas',
        url: '/vendas',
        icon: ShoppingCart,
        roles: ['Admin', 'Manager', 'Seller'],
      },
      {
        title: 'Orçamentos',
        url: '/orcamentos',
        icon: FileText,
        roles: ['Admin', 'Manager', 'Seller'],
      },
      { title: 'Estoque', url: '/estoque', icon: Package, roles: ['Admin', 'Manager'] },
      { title: 'Compras', url: '/compras', icon: ShoppingBag, roles: ['Admin', 'Manager'] },
      { title: 'Fornecedores', url: '/fornecedores', icon: Truck, roles: ['Admin', 'Manager'] },
      {
        title: 'Financeiro (A Receber)',
        url: '/contas-receber',
        icon: Landmark,
        roles: ['Admin', 'Manager'],
      },
      { title: 'Notas Fiscais', url: '/notas-fiscais', icon: ReceiptText, roles: ['Admin'] },
      {
        title: 'Desempenho Equipe',
        url: '/desempenho',
        icon: TrendingUp,
        roles: ['Admin', 'Manager'],
      },
      { title: 'Relatórios', url: '/relatorios', icon: BarChart3, roles: ['Admin', 'Manager'] },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { title: 'Produtos', url: '/produtos', icon: Boxes, roles: ['Admin', 'Manager'] },
      { title: 'Vendedores', url: '/vendedores', icon: Tags, roles: ['Admin', 'Manager'] },
      { title: 'Clientes', url: '/clientes', icon: Users, roles: ['Admin', 'Manager'] },
      { title: 'Usuários do Sistema', url: '/colaboradores', icon: UserCog, roles: ['Admin'] },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { role } = useAppContext()

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
        {menuSections.map((section, idx) => {
          const sectionItems = section.items.filter((item) => item.roles.includes(role))
          if (sectionItems.length === 0) return null

          return (
            <SidebarGroup key={idx}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sectionItems.map((item) => (
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
          )
        })}
      </SidebarContent>
    </Sidebar>
  )
}
