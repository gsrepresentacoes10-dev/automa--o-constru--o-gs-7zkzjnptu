import { useState } from 'react'
import { Plus, Pencil, Trash2, Tags, Search } from 'lucide-react'
import { useAppContext, Seller } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function Sellers() {
  const { sellers, addSeller, updateSeller, deleteSeller } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')

  const filteredSellers = sellers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const openNew = () => {
    setEditingSeller(null)
    setCode('')
    setName('')
    setIsFormOpen(true)
  }

  const openEdit = (seller: Seller) => {
    setEditingSeller(seller)
    setCode(seller.code)
    setName(seller.name)
    setIsFormOpen(true)
  }

  const handleSave = () => {
    if (!code.trim() || !name.trim()) return

    if (editingSeller) {
      updateSeller(editingSeller.id, { code: code.trim(), name: name.trim() })
    } else {
      addSeller({ code: code.trim(), name: name.trim() })
    }
    setIsFormOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastro de Vendedores</h1>
          <p className="text-muted-foreground">Gerencie a equipe de vendas e seus códigos.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Vendedor
        </Button>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Código</TableHead>
              <TableHead>Nome do Vendedor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSellers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Tags className="h-4 w-4 text-primary" />
                    {s.code}
                  </div>
                </TableCell>
                <TableCell className="font-bold">{s.name}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => deleteSeller(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredSellers.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Nenhum vendedor encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSeller ? 'Editar Vendedor' : 'Novo Vendedor'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Código do Vendedor (ID / Crachá)</Label>
              <Input
                placeholder="Ex: V001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                placeholder="Ex: Pedro Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!code.trim() || !name.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
