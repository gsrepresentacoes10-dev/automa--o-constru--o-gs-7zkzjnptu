import { useState, useMemo } from 'react'
import { UserCog, Plus, Trash2, Shield, Search, Check, ShieldCheck } from 'lucide-react'
import { useAppContext, Role, User } from '@/context/AppContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { toast } from '@/hooks/use-toast'

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

export default function Staff() {
  const { users, addUser, updateUser, deleteUser, currentUser } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newRole, setNewRole] = useState<Role>('Seller')

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [users, searchTerm])

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

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  const toggleModule = (module: string) => {
    const modulePerms = PERMISSION_MODULES[module as keyof typeof PERMISSION_MODULES].map(
      (p) => p.id,
    )
    const allSelected = modulePerms.every((p) => selectedPermissions.includes(p))

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !modulePerms.includes(p)))
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...modulePerms])))
    }
  }

  const savePermissions = () => {
    if (editingUser) {
      updateUser(editingUser.id, { permissions: selectedPermissions })
      toast({ title: `Acessos atualizados para ${editingUser.name}` })
      setEditingUser(null)
    }
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
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Colaboradores e Acessos</h1>
          <p className="text-muted-foreground">
            Gerencie as permissões e níveis de acesso da sua equipe.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
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
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit">Cadastrar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" /> Colaboradores do Sistema
          </CardTitle>
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
                    {s.id === '1' && <ShieldCheck className="h-4 w-4 text-primary" />}
                    {s.name}
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
                        title={
                          s.id === '1' ? 'Perfil Master não pode ser editado' : 'Editar Acessos'
                        }
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

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Permissões de Acesso: {editingUser?.name}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 -mr-4 py-4">
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
                        <Label
                          htmlFor={`mod-${module}`}
                          className="text-base font-semibold cursor-pointer"
                        >
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
