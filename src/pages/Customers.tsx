import { Users, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

export default function Customers() {
  const mockCustomers = [
    {
      id: '1',
      name: 'Construtora Alpha Ltda',
      document: '12.345.678/0001-90',
      phone: '(11) 98765-4321',
      totalSpent: 45600.0,
    },
    {
      id: '2',
      name: 'João Silva',
      document: '123.456.789-00',
      phone: '(11) 91234-5678',
      totalSpent: 3450.5,
    },
    {
      id: '3',
      name: 'Maria Souza',
      document: '987.654.321-11',
      phone: '(11) 99876-5432',
      totalSpent: 890.0,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie sua carteira de clientes e histórico de compras.
          </p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou documento..." className="pl-9" />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right">Total Comprado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCustomers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    {c.name}
                  </TableCell>
                  <TableCell>{c.document}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatCurrency(c.totalSpent)}
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
