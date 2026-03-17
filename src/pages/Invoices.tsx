import { useState } from 'react'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { FileText, Download, Eye } from 'lucide-react'
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

export default function Invoices() {
  const { sales } = useAppContext()
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notas Fiscais</h1>
        <p className="text-muted-foreground">Gerencie emissões de NFe e NFCe.</p>
      </div>

      <div className="bg-card border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número / Ref</TableHead>
              <TableHead>Data Emissão</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-center">Status Sefaz</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => {
              const isIssued = sale.status === 'Pago'
              return (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">
                    {isIssued ? `NFCe-${sale.id.replace('V-', '')}` : sale.id}
                  </TableCell>
                  <TableCell>{new Date(sale.date).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{sale.customer || 'Consumidor Final'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(sale.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    {isIssued ? (
                      <Badge className="bg-emerald-500">Autorizada</Badge>
                    ) : (
                      <Badge variant="secondary">Processando</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(sale.id)}>
                      <Eye className="h-4 w-4 mr-2" /> Ver PDF
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> DANFE Simplificado
            </DialogTitle>
            <DialogDescription>Simulação de visualização de nota fiscal.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 bg-muted/30 border rounded-md p-6 font-mono text-sm overflow-y-auto">
            <div className="text-center border-b pb-4 mb-4 border-dashed border-border/80">
              <h2 className="font-bold text-lg">CONSTRUMASTER MATERIAIS DE CONSTRUÇÃO</h2>
              <p>CNPJ: 12.345.678/0001-90</p>
              <p>Rua Exemplo, 123 - Centro</p>
              <br />
              <p className="font-bold">
                DOCUMENTO AUXILIAR DA NOTA FISCAL DE CONSUMIDOR ELETRÔNICA
              </p>
            </div>
            <div className="space-y-2 mb-4 border-b pb-4 border-dashed border-border/80">
              <p>#|COD|DESC|QTD|UN|VL UN R$|VL ITEM R$</p>
              <p>1 CIM-001 CIMENTO CP II 10 SC 35,90 359,00</p>
              <p>2 ARG-003 ARGAMASSA 5 SC 28,50 142,50</p>
            </div>
            <div className="text-right font-bold text-lg mb-8">VALOR TOTAL R$ 501,50</div>
            <div className="text-center text-xs text-muted-foreground break-all">
              <p>Consulte pela Chave de Acesso em</p>
              <p>http://www.sefaz.gov.br/nfce/consulta</p>
              <p className="mt-2 font-bold">1234 5678 9012 3456 7890 1234 5678 9012 3456 7890</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> XML
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
