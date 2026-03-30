import { useState, useMemo } from 'react'
import {
  UserCog,
  Plus,
  Trash2,
  Shield,
  Search,
  Check,
  ShieldCheck,
  ListTree,
  Tags,
  History,
} from 'lucide-react'
import { useAppContext, Role, User } from '@/context/AppContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const PERMISSION_MODULES = {
  Dashboard: [
    { id: 'dashboard_kpis_pessoais', label: 'Ver KPIs pessoais' },
    { id: 'dashboard_kpis_totais', label: 'Ver KPIs totais' },
  ],
  'PDV/Vendas': [
    { id: 'pdv_buscar_produtos', label: 'Buscar produtos' },
    { id: 'pdv_manipular_precos', label: 'Manipular preços (créditos/promoções)' },
    { id: 'pdv_aplicar_descontos', label: 'Aplicar descontos R$/ %' },
    { id: 'pdv_finalizar_venda', label: 'Finalizar venda' },
    { id: 'pdv_emitir_nfe', label: 'Emitir NF-e' },
  ],
  Cadastros: [
    { id: 'cadastros_produtos', label: 'Produtos' },
    { id: 'cadastros_clientes', label: 'Clientes' },
    { id: 'cadastros_fornecedores', label: 'Fornecedores' },
    { id: 'cadastros_usuarios', label: 'Usuários (criar/editar)' },
  ],
  Estoque: [
    { id: 'estoque_movimentacoes', label: 'Entradas/saídas' },
    { id: 'estoque_inventario', label: 'Inventário' },
    { id: 'estoque_transferencias', label: 'Transferências' },
    { id: 'estoque_alertas', label: 'Alertas estoque mínimo' },
  ],
  Financeiro: [
    { id: 'financeiro_caixa', label: 'Fechamento caixa' },
    { id: 'financeiro_contas', label: 'Contas pagar/receber' },
    { id: 'financeiro_conciliacao', label: 'Conciliação bancária' },
  ],
  Compras: [
    { id: 'compras_pedidos', label: 'Pedidos fornecedores' },
    { id: 'compras_recebimento', label: 'Recebimento mercadorias' },
  ],
  Relatórios: [
    { id: 'relatorios_basicos', label: 'Básicos (pessoais)' },
    { id: 'relatorios_avancados', label: 'Avançados (export PDF/Excel)' },
    { id: 'relatorios_customizados', label: 'Customizados' },
  ],
  Configurações: [
    { id: 'config_limites_pdv', label: 'Limites PDV (% desconto/aumento)' },
    { id: 'config_promocoes', label: 'Promoções produtos' },
    { id: 'config_rbac', label: 'RBAC acessos' },
  ],
  Gestão: [
    { id: 'gestao_comissoes', label: 'Comissões colaboradores' },
    { id: 'gestao_metas', label: 'Metas' },
    { id: 'gestao_aprovacoes', label: 'Aprovações pendentes' },
  ],
}

const PermissionsMatrix = ({
  selectedPermissions,
  onChange,
}: {
  selectedPermissions: string[]
  onChange: (perms: string[]) => void
}) => {
  const togglePermission = (id: string) => {
    onChange(
      selectedPermissions.includes(id)
        ? selectedPermissions.filter((p) => p !== id)
        : [...selectedPermissions, id],
    )
  }
  const toggleModule = (module: string) => {
    const modulePerms = PERMISSION_MODULES[module as keyof typeof PERMISSION_MODULES].map(
      (p) => p.id,
    )
    const allSelected = modulePerms.every((p) => selectedPermissions.includes(p))
    if (allSelected) onChange(selectedPermissions.filter((p) => !modulePerms.includes(p)))
    else onChange(Array.from(new Set([...selectedPermissions, ...modulePerms])))
  }
  return (
    <div className="space-y-6">
      {Object.entries(PERMISSION_MODULES).map(([module, perms]) => {
        const allSelected = perms.every((p) => selectedPermissions.includes(p.id))
        const someSelected = perms.some((p) => selectedPermissions.includes(p.id))
        return (
          <Card key={module} className="shadow-none border-muted">
            <CardHeader className="py-3 bg-muted/30 border-b">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`mod-${module}`}
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={() => toggleModule(module)}
                />
                <Label htmlFor={`mod-${module}`} className="text-base font-semibold cursor-pointer">
                  {module}
                </Label>
              </div>
            </CardHeader>
            <CardContent className="py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {perms.map((p) => (
                  <div key={p.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`perm-${p.id}`}
                      checked={selectedPermissions.includes(p.id)}
                      onCheckedChange={() => togglePermission(p.id)}
                    />
                    <Label
                      htmlFor={`perm-${p.id}`}
                      className="text-sm cursor-pointer leading-tight pt-0.5"
                    >
                      {p.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default function Staff() {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    customRoles,
    addCustomRole,
    deleteCustomRole,
    permissionAuditLogs,
  } = useAppContext()
  const [activeTab, setActiveTab] = useState('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newRole, setNewRole] = useState<Role>('Seller')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const [isAddingCustomRole, setIsAddingCustomRole] = useState(false)
  const [newCustomRoleName, setNewCustomRoleName] = useState('')
  const [newCustomRolePerms, setNewCustomRolePerms] = useState<string[]>([])

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [users, searchTerm],
  )

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    addUser({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: newRole,
      permissions: [],
    })
    setIsAdding(false)
  }

  const handleEditPermissions = (user: User) => {
    if (user.id === '1') return
    setEditingUser(user)
    setSelectedPermissions(user.permissions || [])
  }

  const savePermissions = () => {
    if (editingUser) {
      updateUser(editingUser.id, { permissions: selectedPermissions })
      toast({ title: `Acessos atualizados para ${editingUser.name}` })
      setEditingUser(null)
    }
  }

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustomRoleName) return
    addCustomRole({ name: newCustomRoleName, permissions: newCustomRolePerms })
    setIsAddingCustomRole(false)
    setNewCustomRoleName('')
    setNewCustomRolePerms([])
  }

  const roleColors: Record<Role, 'default' | 'secondary' | 'outline'> = {
    Admin: 'default',
    Manager: 'secondary',
    Seller: 'outline',
  }
  const roleLabels: Record<Role, string> = {
    Admin: 'Admin',
    Manager: 'Gerente',
    Seller: 'Colaborador',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Equipe e Acessos</h1>
          <p className="text-muted-foreground">
            Gerencie colaboradores, cargos, permissões e visualize a hierarquia.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 border overflow-x-auto whitespace-nowrap justify-start">
          <TabsTrigger value="users" className="flex gap-2">
            <UserCog className="w-4 h-4" /> Colaboradores
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex gap-2">
            <Tags className="w-4 h-4" /> Cargos / Perfis
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="flex gap-2">
            <ListTree className="w-4 h-4" /> Hierarquia
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex gap-2">
            <History className="w-4 h-4" /> Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar colaborador..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Novo Colaborador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAdd}>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Colaborador</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input name="name" required placeholder="Ex: João da Silva" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        name="email"
                        type="email"
                        required
                        placeholder="joao@construmaster.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Perfil Base</Label>
                      <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin (Acesso Total)</SelectItem>
                          <SelectItem value="Manager">Gerente</SelectItem>
                          <SelectItem value="Seller">Colaborador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsAdding(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Cadastrar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Colaboradores do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {s.id === '1' && <ShieldCheck className="h-4 w-4 text-primary" />} {s.name}
                      </TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleColors[s.role]}>{roleLabels[s.role]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPermissions(s)}
                            disabled={s.id === '1'}
                          >
                            <Shield className="h-4 w-4 mr-2" /> Acessos
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteUser(s.id)}
                            disabled={s.id === '1'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum colaborador encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddingCustomRole} onOpenChange={setIsAddingCustomRole}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Criar Cargo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <form
                  onSubmit={handleAddCustomRole}
                  className="flex flex-col h-full overflow-hidden"
                >
                  <DialogHeader className="pb-4">
                    <DialogTitle>Novo Cargo / Perfil de Acesso</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pb-4">
                    <div className="space-y-2">
                      <Label>Nome do Cargo</Label>
                      <Input
                        required
                        value={newCustomRoleName}
                        onChange={(e) => setNewCustomRoleName(e.target.value)}
                        placeholder="Ex: Estoquista Sênior"
                      />
                    </div>
                  </div>
                  <ScrollArea className="flex-1 pr-4 -mr-4 border-t pt-4">
                    <PermissionsMatrix
                      selectedPermissions={newCustomRolePerms}
                      onChange={setNewCustomRolePerms}
                    />
                  </ScrollArea>
                  <DialogFooter className="pt-4 border-t mt-auto">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setIsAddingCustomRole(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Salvar Cargo</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRoles.map((role) => (
              <Card key={role.id}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                  <CardTitle className="text-base">{role.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteCustomRole(role.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {role.permissions.length} permissões vinculadas
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((p) => (
                      <Badge
                        key={p}
                        variant="secondary"
                        className="text-[10px] truncate max-w-[120px]"
                      >
                        {p}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{role.permissions.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle>Organograma</CardTitle>
              <CardDescription>
                Estrutura organizacional baseada nos perfis de sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 bg-muted/10 rounded-xl border overflow-x-auto min-w-full">
                <div className="flex gap-8 mb-8">
                  {users
                    .filter((u) => u.role === 'Admin')
                    .map((a) => (
                      <div key={a.id} className="flex flex-col items-center">
                        <div className="bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-sm border border-primary/20 min-w-[200px] text-center z-10">
                          <ShieldCheck className="w-5 h-5 mx-auto mb-1 opacity-80" />
                          <div className="font-bold whitespace-nowrap">{a.name}</div>
                          <div className="text-xs opacity-90">Admin (Master)</div>
                        </div>
                        {(users.some((u) => u.role === 'Manager') ||
                          users.some((u) => u.role === 'Seller')) && (
                          <div className="w-px h-8 bg-border"></div>
                        )}
                      </div>
                    ))}
                </div>
                {users.some((u) => u.role === 'Manager') && (
                  <div className="flex gap-8 mb-8 relative">
                    {users.filter((u) => u.role === 'Manager').length > 1 && (
                      <div className="absolute top-0 left-[50%] right-[50%] h-px bg-border -translate-x-1/2 w-[calc(100%-200px)]"></div>
                    )}
                    {users
                      .filter((u) => u.role === 'Manager')
                      .map((m) => (
                        <div key={m.id} className="flex flex-col items-center relative">
                          <div className="w-px h-4 bg-border absolute -top-4"></div>
                          <div className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg shadow-sm border min-w-[200px] text-center z-10">
                            <UserCog className="w-5 h-5 mx-auto mb-1 opacity-80" />
                            <div className="font-bold whitespace-nowrap">{m.name}</div>
                            <div className="text-xs opacity-90">Gerente</div>
                          </div>
                          {users.some((u) => u.role === 'Seller') && (
                            <div className="w-px h-8 bg-border"></div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
                {users.some((u) => u.role === 'Seller') && (
                  <div className="flex gap-4 flex-wrap justify-center relative max-w-4xl">
                    {users
                      .filter((u) => u.role === 'Seller')
                      .map((s) => (
                        <div
                          key={s.id}
                          className="bg-card text-card-foreground px-4 py-2 rounded-lg shadow-sm border min-w-[150px] text-center z-10"
                        >
                          <div className="font-medium whitespace-nowrap">{s.name}</div>
                          <div className="text-xs text-muted-foreground">Colaborador</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Auditoria de Permissões</CardTitle>
              <CardDescription>
                Histórico de alterações nos acessos dos colaboradores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionAuditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum registro de auditoria encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    permissionAuditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{log.adminName}</TableCell>
                        <TableCell>{log.targetUserName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell
                          className="text-xs text-muted-foreground max-w-md truncate"
                          title={log.details}
                        >
                          {log.details}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Permissões de Acesso: {editingUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2 border-b">
            <div className="space-y-2 max-w-sm">
              <Label>Aplicar Cargo (Predefinição)</Label>
              <Select
                onValueChange={(val) => {
                  const role = customRoles.find((r) => r.id === val)
                  if (role) setSelectedPermissions(role.permissions)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cargo..." />
                </SelectTrigger>
                <SelectContent>
                  {customRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Isso substituirá as permissões selecionadas abaixo.
              </p>
            </div>
          </div>
          <ScrollArea className="flex-1 pr-4 -mr-4 py-4">
            <PermissionsMatrix
              selectedPermissions={selectedPermissions}
              onChange={setSelectedPermissions}
            />
          </ScrollArea>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={savePermissions}>
              <Check className="h-4 w-4 mr-2" /> Salvar Permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
