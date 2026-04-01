import { useState, useMemo } from 'react'
import { FileText, Download, Eye, Search, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { useAppContext } from '@/context/AppContext'

const MOCK_INWARD_NFS = [
  {
    id: '123456',
    series: '1',
    vendor: 'Votorantim Cimentos',
    emissionDate: '2026-03-01T00:00:00Z',
    entryDate: '2026-03-03T00:00:00Z',
    totalValue: 2550.0,
    status: 'Processada',
    items: [{ name: 'Cimento CP II 50kg', qty: 100, unit: 'SC', cost: 25.5 }],
  },
  {
    id: '998877',
    series: '2',
    vendor: 'Tigre Tubos',
    emissionDate: '2026-03-10T00:00:00Z',
    entryDate: '2026-03-12T00:00:00Z',
    totalValue: 1200.0,
    status: 'Processada',
    items: [{ name: 'Tubo Esgoto 100mm 6m', qty: 30, unit: 'UN', cost: 40.0 }],
  },
  {
    id: '554433',
    series: '1',
    vendor: 'Gerdau S.A.',
    emissionDate: '2026-03-15T00:00:00Z',
    entryDate: '2026-03-16T00:00:00Z',
    totalValue: 8500.0,
    status: 'Aguardando Estoque',
    items: [{ name: 'Vergalhão 3/8 (10mm)', qty: 200, unit: 'UN', cost: 42.5 }],
  },
]

export default function InvoiceEntryHistory() {
  const { role } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNf, setSelectedNf] = useState<(typeof MOCK_INWARD_NFS)[0] | null>(null)

  const filteredNfs = useMemo(() => {
    return MOCK_INWARD_NFS.filter(
      (nf) =>
        nf.id.includes(searchTerm) || nf.vendor.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [searchTerm])

  if (role !== 'Admin' && role !== 'Manager') {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <AlertCircle className="h-10 w-10 text-muted-foreground opacity-50" />
        <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
        <p className="text-muted-foreground">
          Você não tem permissão para acessar o histórico de NFs.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-indigo-600" />
            Histórico de Entradas NF
          </h1>
          <p className="text-muted-foreground mt-1">
            Consulta de notas fiscais de fornecedores já processadas no sistema.
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex justify-between items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Fornecedor ou Nº da NF..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Nº NF</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data Emissão</TableHead>
                <TableHead>Data Entrada</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNfs.map((nf) => (
                <TableRow key={nf.id} className="hover:bg-muted/30">
                  <TableCell className="font-bold pl-6">{nf.id}</TableCell>
                  <TableCell>{nf.series}</TableCell>
                  <TableCell className="font-medium">{nf.vendor}</TableCell>
                  <TableCell>{new Date(nf.emissionDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{new Date(nf.entryDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(nf.totalValue)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={nf.status === 'Processada' ? 'default' : 'secondary'}
                      className={
                        nf.status === 'Processada' ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                      }
                    >
                      {nf.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="outline" size="sm" onClick={() => setSelectedNf(nf)}>
                      <Eye className="h-4 w-4 mr-2" /> Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredNfs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma nota fiscal encontrada com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedNf} onOpenChange={() => setSelectedNf(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
            <DialogDescription>
              Composição de itens e valores registrados na entrada.
            </DialogDescription>
          </DialogHeader>

          {selectedNf && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Nº NF</div>
                  <div className="font-bold text-lg">{selectedNf.id}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Série</div>
                  <div className="font-bold text-lg">{selectedNf.series}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Fornecedor</div>
                  <div className="font-bold text-lg truncate" title={selectedNf.vendor}>
                    {selectedNf.vendor}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Data Emissão</div>
                  <div className="font-medium">
                    {new Date(selectedNf.emissionDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Data Entrada</div>
                  <div className="font-medium">
                    {new Date(selectedNf.entryDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Valor Total (NF)</div>
                  <div className="font-bold text-lg text-primary">
                    {formatCurrency(selectedNf.totalValue)}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">
                  Itens Lançados ({selectedNf.items.length})
                </h3>
                <div className="border rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-center">UN</TableHead>
                        <TableHead className="text-right">Custo Un.</TableHead>
                        <TableHead className="text-right">Total Item</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedNf.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">{item.qty}</TableCell>
                          <TableCell className="text-center text-muted-foreground text-xs">
                            {item.unit}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(item.qty * item.cost)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" /> Download XML
                </Button>
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" /> Ver PDF (DANFE)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
