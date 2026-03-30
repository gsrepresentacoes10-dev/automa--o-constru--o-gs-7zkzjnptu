import { useAppContext } from '@/context/AppContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function MyStatement() {
  const { currentUser, sellers, sellerCreditHistory } = useAppContext()

  const seller =
    sellers.find((s) => s.id === currentUser.id) || sellers.find((s) => s.name === currentUser.name)

  if (!seller) {
    return (
      <div className="p-8 text-center text-muted-foreground mt-10">
        <h2 className="text-xl font-bold mb-2">Perfil não encontrado</h2>
        <p>Você ainda não possui um perfil de vendedor associado a esta conta.</p>
      </div>
    )
  }

  const history = sellerCreditHistory
    .filter((h) => h.sellerId === seller.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Extrato</h1>
        <p className="text-muted-foreground">
          Acompanhe seus créditos e débitos gerados pelas suas vendas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn('text-3xl font-bold', seller.currentBalance > 0 ? 'text-primary' : '')}
            >
              {formatCurrency(seller.currentBalance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">
              Total de Créditos Recebidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              +{formatCurrency(seller.totalCredits)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Total de Débitos (Descontos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{formatCurrency(seller.totalDebits)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Saldo na Época</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(h.createdAt).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>{h.saleId || '-'}</TableCell>
                  <TableCell>{h.reason || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={h.value > 0 ? 'default' : 'destructive'}
                      className={h.value > 0 ? 'bg-emerald-500' : ''}
                    >
                      {h.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium',
                      h.value > 0 ? 'text-emerald-600' : 'text-red-600',
                    )}
                  >
                    {h.value > 0 ? '+' : ''}
                    {formatCurrency(h.value)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-muted-foreground">
                    {formatCurrency(h.newBalance)}
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma movimentação encontrada.
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
