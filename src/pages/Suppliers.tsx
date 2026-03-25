import { useState } from 'react'
import { useAppContext, Supplier } from '@/context/AppContext'
import { Plus, Search, Truck } from 'lucide-react'
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
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

export default function Suppliers() {
  const { suppliers, setSuppliers } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.document.includes(searchTerm),
  )

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const categoriesStr = formData.get('categories') as string
    const categories = categoriesStr
      ? categoriesStr
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      : []

    const newSupplier: Supplier = {
      id: Date.now().toString(),
      name: formData.get('name') as string,
      document: formData.get('document') as string,
      contact: formData.get('contact') as string,
      categories,
    }
    setSuppliers([...suppliers, newSupplier])
    setIsAdding(false)
    toast({ title: 'Fornecedor adicionado com sucesso!' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie seus parceiros e atacadistas.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Adicionar Fornecedor</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nome / Razão Social</Label>
                  <Input name="name" required />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ / CPF</Label>
                  <Input name="document" required />
                </div>
                <div className="space-y-2">
                  <Label>Categorias Atendidas (separadas por vírgula)</Label>
                  <Input name="categories" placeholder="Ex: Básico, Hidráulica, Elétrica" />
                </div>
                <div className="space-y-2">
                  <Label>Contato / Telefone</Label>
                  <Input name="contact" required />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar fornecedor..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Categorias</TableHead>
              <TableHead>CNPJ / CPF</TableHead>
              <TableHead>Contato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                  {s.name}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={s.categories?.join(', ')}>
                  {s.categories?.join(', ') || '-'}
                </TableCell>
                <TableCell>{s.document}</TableCell>
                <TableCell>{s.contact}</TableCell>
              </TableRow>
            ))}
            {filteredSuppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum fornecedor encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
