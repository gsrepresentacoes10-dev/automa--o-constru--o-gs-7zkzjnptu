import { useState, useMemo } from 'react'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Search, History, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PurchaseHistory() {
  const { purchases, suppliers } = useAppContext()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [productSearch, setProductSearch] = useState('')

  const historyItems = useMemo(() => {
    return purchases
      .flatMap((p) =>
        p.items.map((i) => ({
          id: `${p.id}-${i.product.id}`,
          purchaseId: p.id,
          date: p.date,
          supplierName: p.supplierName,
          productName: i.product.name,
          quantity: i.quantity,
          costPrice: i.costPrice,
          total: i.quantity * i.costPrice,
        })),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [purchases])

  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      if (
        supplierFilter !== 'all' &&
        item.supplierName !== suppliers.find((s) => s.id === supplierFilter)?.name
      ) {
        return false
      }
      if (dateFrom && new Date(item.date) < new Date(dateFrom + 'T00:00:00')) return false
      if (dateTo && new Date(item.date) > new Date(dateTo + 'T23:59:59')) return false
      if (productSearch && !item.productName.toLowerCase().includes(productSearch.toLowerCase())) {
        return false
      }
      return true
    })
  }, [historyItems, supplierFilter, dateFrom, dateTo, productSearch, suppliers])

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setSupplierFilter('all')
    setProductSearch('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico de Compras</h1>
        <p className="text-muted-foreground">
          Registro detalhado de todas as entradas de mercadorias no estoque.
        </p>
      </div>

      <Card className="border shadow-sm">
        <div className="p-4 border-b bg-muted/20 flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-[250px] space-y-1.5">
            <Label>Buscar Produto</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome do produto..."
                className="pl-9"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full md:w-[200px] space-y-1.5">
            <Label>Fornecedor</Label>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os fornecedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto space-y-1.5 flex-1 max-w-[150px]">
            <Label>Data Inicial</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="w-full md:w-auto space-y-1.5 flex-1 max-w-[150px]">
            <Label>Data Final</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          <Button variant="ghost" onClick={clearFilters} className="shrink-0">
            <Filter className="mr-2 h-4 w-4" /> Limpar
          </Button>
        </div>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Data de Entrada</TableHead>
                <TableHead>Produto / Descrição</TableHead>
                <TableHead className="text-center">Qtd Recebida</TableHead>
                <TableHead className="text-right">Preço Unit.</TableHead>
                <TableHead className="text-right">Preço Total</TableHead>
                <TableHead className="pr-6">Fornecedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-6 whitespace-nowrap">
                    {new Date(item.date).toLocaleDateString('pt-BR')}
                    <div className="text-xs text-muted-foreground">ID: {item.purchaseId}</div>
                  </TableCell>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(item.costPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total)}
                  </TableCell>
                  <TableCell className="pr-6 text-sm">
                    {item.supplierName || 'Desconhecido'}
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    Nenhum registro de compra encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
