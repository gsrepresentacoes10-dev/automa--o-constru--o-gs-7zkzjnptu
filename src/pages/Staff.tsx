import { UserCog } from 'lucide-react'
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

export default function Staff() {
  const mockStaff = [
    { id: '1', name: 'Carlos Admin', role: 'Admin', email: 'carlos@construmaster.com' },
    { id: '2', name: 'Ana Vendedora', role: 'Vendedor', email: 'ana@construmaster.com' },
    { id: '3', name: 'Pedro Estoque', role: 'Estoquista', email: 'pedro@construmaster.com' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Colaboradores</h1>
        <p className="text-muted-foreground">Gerencie o acesso e permissões da sua equipe.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" /> Controle de Acessos (RBAC)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 p-4 rounded-md mb-6 border text-sm text-muted-foreground">
            <strong>Dica de Demonstração:</strong> Use o menu no canto superior direito (Avatar do
            Usuário) para alternar entre as visões de Administrador, Vendedor e Estoquista e ver
            como o menu lateral se adapta automaticamente.
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo / Nível de Acesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStaff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>
                    <Badge variant={s.role === 'Admin' ? 'default' : 'secondary'}>{s.role}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
