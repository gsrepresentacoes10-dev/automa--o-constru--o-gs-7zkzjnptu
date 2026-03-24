import { useState, useMemo } from 'react'
import { Users, Search, History, Wallet, ArrowRight, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { useAppContext, Customer } from '@/context/AppContext'

export default function Customers() {
  const { customers, sales, quotes, addCustomer } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.document.includes(searchTerm),
  )

  const handleAddCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    addCustomer({
      name: formData.get('name') as string,
      document: formData.get('document') as string,
      phone: formData.get('phone') as string,
    })
    setIsAdding(false)
  }

  const customerSales = useMemo(() => {
    if (!selectedCustomer) return []
    return sales.filter((s) => s.customerId === selectedCustomer.id)
  }, [sales, selectedCustomer])

  const customerQuotes = useMemo(() => {
    if (!selectedCustomer) return []
    return quotes.filter((q) => q.customerId === selectedCustomer.id)
  }, [quotes, selectedCustomer])

  const totalOutstandingBalance = useMemo(() => {
    return customerSales
      .filter((s) => s.status === 'Pendente' && s.paymentMethod === 'Venda a Prazo')
      .reduce((acc, curr) => acc + curr.total, 0)
  }, [customerSales])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes e Fidelidade</h1>
          <p className="text-muted-foreground">
            Gerencie sua carteira de clientes, histórico de compras e saldos de cashback.
          </p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddCustomer}>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nome Completo / Razão Social</Label>
                  <Input name="name" required placeholder="Ex: João da Silva" />
                </div>
                <div className="space-y-2">
                  <Label>CPF / CNPJ</Label>
                  <Input name="document" required placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input name="phone" required placeholder="(11) 99999-9999" />
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

      <Card>
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou documento..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                <TableHead className="text-right">Saldo Cashback</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/50 group"
                  onClick={() => setSelectedCustomer(c)}
                >
                  <TableCell className="font-medium flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    {c.name}
                  </TableCell>
                  <TableCell>{c.document}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(c.totalSpent)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-600">
                    {formatCurrency(c.cashbackBalance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <SheetContent className="sm:max-w-[600px] w-[90vw] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl">{selectedCustomer?.name}</SheetTitle>
            <SheetDescription className="flex gap-4">
              <span>Doc: {selectedCustomer?.document}</span>
              <span>Tel: {selectedCustomer?.phone}</span>
            </SheetDescription>
          </SheetHeader>

          {totalOutstandingBalance > 0 && (
            <Card className="mb-6 bg-destructive/5 border-destructive/20 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-destructive">
                  <Wallet className="h-5 w-5" />
                  <span className="font-semibold">Saldo Devedor Total</span>
                </div>
                <span className="text-2xl font-bold text-destructive">
                  {formatCurrency(totalOutstandingBalance)}
                </span>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" /> Histórico
            </h3>

            <Tabs defaultValue="sales" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sales">Compras Realizadas</TabsTrigger>
                <TabsTrigger value="quotes">Orçamentos</TabsTrigger>
              </TabsList>

              <TabsContent value="sales" className="mt-4">
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Pedido / Data</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <div className="font-medium text-xs">{sale.id}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(sale.date).toLocaleDateString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{sale.paymentMethod || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-sm">
                            {formatCurrency(sale.total)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                sale.status === 'Pago'
                                  ? 'default'
                                  : sale.status === 'Pendente'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                              className={sale.status === 'Pago' ? 'bg-emerald-500' : ''}
                            >
                              {sale.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {customerSales.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            Nenhuma compra registrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="quotes" className="mt-4">
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Nº / Data</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerQuotes.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell>
                            <div className="font-medium text-xs">{q.id}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(q.date).toLocaleDateString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-sm">
                            {formatCurrency(q.total)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={q.status === 'Pendente' ? 'secondary' : 'default'}
                              className={q.status === 'Convertido' ? 'bg-emerald-500' : ''}
                            >
                              {q.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {customerQuotes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                            Nenhum orçamento registrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
