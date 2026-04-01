import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  UserCog,
  BarChart3,
  HardHat,
  Landmark,
  Wallet,
  FileText,
  ShoppingBag,
  Truck,
  TrendingUp,
  Tags,
  Boxes,
  LineChart,
  History,
  Search,
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
      {
        title: 'Pesquisa de Vendas',
        url: '/pesquisa-vendas',
        icon: Search,
        roles: ['Admin', 'Manager', 'Seller'],
      },
      { title: 'Estoque', url: '/estoque', icon: Package, roles: ['Admin', 'Manager'] },
      { title: 'Compras', url: '/compras', icon: ShoppingBag, roles: ['Admin', 'Manager'] },
      {
        title: 'Histórico de Compras',
        url: '/historico-compras',
        icon: History,
        roles: ['Admin', 'Manager'],
      },
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
    label: 'Financeiro',
    items: [
      {
        title: 'Fluxo de Caixa',
        url: '/fluxo-caixa',
        icon: LineChart,
        roles: ['Admin', 'Manager'],
      },
      {
        title: 'Contas a Receber',
        url: '/contas-receber',
        icon: Landmark,
        roles: ['Admin', 'Manager'],
      },
      {
        title: 'Contas a Pagar',
        url: '/contas-a-pagar',
        icon: Wallet,
        roles: ['Admin', 'Manager'],
      },
      {
        title: 'Meu Extrato',
        url: '/meu-extrato',
        icon: Wallet,
        roles: ['Seller'],
      },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { title: 'Produtos', url: '/produtos', icon: Boxes, roles: ['Admin', 'Manager', 'Seller'] },
      { title: 'Fornecedores', url: '/fornecedores', icon: Truck, roles: ['Admin', 'Manager'] },
      { title: 'Entrada de NF', url: '/entrada-nf', icon: FileText, roles: ['Admin', 'Manager'] },
      {
        title: 'Histórico Entradas NF',
        url: '/historico-entradas-nf',
        icon: History,
        roles: ['Admin', 'Manager'],
      },
      { title: 'Colaboradores', url: '/colaboradores', icon: Tags, roles: ['Admin', 'Manager'] },
      { title: 'Clientes', url: '/clientes', icon: Users, roles: ['Admin', 'Manager'] },
      {
        title: 'Acessos e Permissões',
        url: '/usuarios',
        icon: UserCog,
        roles: ['Admin', 'Manager'],
      },
      { title: 'Logs de Acesso', url: '/logs-acesso', icon: History, roles: ['Admin'] },
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
