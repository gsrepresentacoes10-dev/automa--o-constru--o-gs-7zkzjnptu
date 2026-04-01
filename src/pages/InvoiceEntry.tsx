import { useState } from 'react'
import { Upload, Calculator, PackagePlus, Check, FileText, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductForm } from '@/components/products/ProductForm'
import { Badge } from '@/components/ui/badge'

interface InvoiceItem {
  id: string
  name: string
  ean: string
  quantity: number
  unitCost: number
  total: number
  isRegistered: boolean
  priceCalculated?: boolean
  pricing?: {
    initialCost: number
    taxes: number
    taxesType: '%' | 'R$'
    admin: number
    adminType: '%' | 'R$'
    profitMargin: number
    promoPrice: number
    finalPrice: number
  }
}

export default function InvoiceEntry() {
  const { toast } = useToast()
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)

  const [pricingForm, setPricingForm] = useState({
    taxes: 0,
    taxesType: '%' as const,
    admin: 0,
    adminType: '%' as const,
    profitMargin: 30,
    promoPrice: 0,
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setTimeout(() => {
      const parsedItems: InvoiceItem[] = [
        {
          id: '1',
          name: 'Cimento CP II 50kg',
          ean: '7891010101010',
          quantity: 100,
          unitCost: 25.5,
          total: 2550.0,
          isRegistered: true,
        },
        {
          id: '2',
          name: 'Tijolo Baiano 8 Furos',
          ean: '7893030303030',
          quantity: 1000,
          unitCost: 0.85,
          total: 850.0,
          isRegistered: false,
        },
      ]
      setItems(parsedItems)
      setIsUploading(false)
      toast({
        title: 'Arquivo processado',
        description: `Foram encontrados ${parsedItems.length} itens na nota.`,
      })
    }, 1500)
  }

  const openCreateProduct = (item: InvoiceItem) => {
    setSelectedItem(item)
    setIsProductModalOpen(true)
  }

  const handleProductCreated = () => {
    setItems(items.map((i) => (i.id === selectedItem?.id ? { ...i, isRegistered: true } : i)))
    setIsProductModalOpen(false)
    toast({
      title: 'Produto criado',
      description: 'O produto foi cadastrado com sucesso.',
    })
  }

  const openPricing = (item: InvoiceItem) => {
    setSelectedItem(item)
    setPricingForm({
      taxes: item.pricing?.taxes || 0,
      taxesType: item.pricing?.taxesType || '%',
      admin: item.pricing?.admin || 0,
      adminType: item.pricing?.adminType || '%',
      profitMargin: item.pricing?.profitMargin || 30,
      promoPrice: item.pricing?.promoPrice || 0,
    })
    setAcknowledgeLoss(false)
    setIsPricingModalOpen(true)
  }

  const [acknowledgeLoss, setAcknowledgeLoss] = useState(false)

  const calculateCosts = () => {
    if (!selectedItem) return { totalCost: 0, finalPrice: 0 }
    const cost = selectedItem.unitCost
    const taxesVal =
      pricingForm.taxesType === '%' ? cost * (pricingForm.taxes / 100) : pricingForm.taxes
    const subtotal1 = cost + taxesVal
    const adminVal =
      pricingForm.adminType === '%' ? subtotal1 * (pricingForm.admin / 100) : pricingForm.admin
    const totalCost = subtotal1 + adminVal
    const finalPrice = totalCost * (1 + pricingForm.profitMargin / 100)
    return { totalCost, finalPrice }
  }

  const { totalCost, finalPrice } = calculateCosts()
  const effectivePrice = pricingForm.promoPrice > 0 ? pricingForm.promoPrice : finalPrice
  const isBelowCost = effectivePrice < totalCost

  const savePricing = () => {
    if (!selectedItem) return
    if (isBelowCost && !acknowledgeLoss) return

    setItems(
      items.map((i) =>
        i.id === selectedItem.id
          ? {
              ...i,
              priceCalculated: true,
              pricing: {
                initialCost: i.unitCost,
                ...pricingForm,
                finalPrice,
              },
            }
          : i,
      ),
    )

    setIsPricingModalOpen(false)
    toast({
      title: 'Preço formado',
      description: 'As regras de precificação foram aplicadas ao item.',
    })
  }

  const handleLancarEstoque = () => {
    if (items.length === 0) return
    if (items.some((i) => !i.isRegistered)) {
      toast({
        title: 'Atenção',
        description: 'Existem produtos não cadastrados. Cadastre-os antes de lançar.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Sucesso',
      description: `Estoque atualizado. Produtos lançados: ${items.length} itens.`,
    })
    setItems([])
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-20 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Entrada de NF
          </h1>
          <p className="text-muted-foreground mt-1">
            Importação de XML/PDF e formação de preços inteligente.
          </p>
        </div>
        <Button
          onClick={handleLancarEstoque}
          disabled={items.length === 0}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Check className="h-4 w-4" />
          Lançar Estoque
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Dados da Nota</CardTitle>
            <CardDescription>Preenchimento manual ou automático via arquivo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Número da NF</Label>
                <Input placeholder="Ex: 123456" />
              </div>
              <div className="space-y-2">
                <Label>Série</Label>
                <Input placeholder="Ex: 1" />
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Votorantim Cimentos</SelectItem>
                    <SelectItem value="2">Gerdau S.A.</SelectItem>
                    <SelectItem value="3">Tigre Tubos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Emissão</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Data de Entrada</Label>
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Importar Arquivo</CardTitle>
            <CardDescription>Upload do XML ou PDF da NF-e.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-muted/20">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <Label
              htmlFor="file-upload"
              className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm font-medium text-sm"
            >
              {isUploading ? 'Processando...' : 'Selecionar Arquivo'}
            </Label>
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".xml,.pdf"
              onChange={handleFileUpload}
            />
            <p className="text-xs text-muted-foreground mt-3">XML ou PDF (Máx. 5MB)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Itens da Nota</CardTitle>
          <CardDescription>
            Revise os itens, cadastre novos produtos e forme o preço de venda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>EAN</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Custo Un.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground/50" />
                        <p>Nenhum item importado. Faça o upload do arquivo para visualizar.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.ean}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.unitCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.isRegistered ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Cadastrado
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200"
                          >
                            Não Encontrado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!item.isRegistered ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openCreateProduct(item)}
                            className="gap-1.5 h-8"
                          >
                            <PackagePlus className="h-3.5 w-3.5" />
                            Criar Produto
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={item.priceCalculated ? 'outline' : 'secondary'}
                            onClick={() => openPricing(item)}
                            className="gap-1.5 h-8"
                          >
                            <Calculator className="h-3.5 w-3.5" />
                            {item.priceCalculated ? 'Editar Preço' : 'Formar Preço'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Produto</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="mt-4 pb-4">
              <ProductForm
                product={
                  {
                    name: selectedItem.name,
                    barcode: selectedItem.ean,
                    costPrice: selectedItem.unitCost,
                    price: 0,
                    category: 'Geral',
                    brand: 'Diversos',
                    unit: 'UN',
                    profitMargin: 30,
                    active: true,
                  } as any
                }
                onSave={handleProductCreated}
                onCancel={() => setIsProductModalOpen(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPricingModalOpen} onOpenChange={setIsPricingModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Formação de Preço Inteligente</DialogTitle>
            <DialogDescription>
              Ajuste os percentuais para calcular o preço de venda final.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-5 py-2">
              <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg border">
                <span className="text-sm font-medium">Custo Inicial (NF)</span>
                <span className="font-bold text-lg">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    selectedItem.unitCost,
                  )}
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-semibold">
                      Impostos
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={pricingForm.taxes}
                        onChange={(e) =>
                          setPricingForm({ ...pricingForm, taxes: Number(e.target.value) })
                        }
                      />
                      <Select
                        value={pricingForm.taxesType}
                        onValueChange={(v: any) => setPricingForm({ ...pricingForm, taxesType: v })}
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="%">%</SelectItem>
                          <SelectItem value="R$">R$</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-semibold">
                      Desp. Admin.
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={pricingForm.admin}
                        onChange={(e) =>
                          setPricingForm({ ...pricingForm, admin: Number(e.target.value) })
                        }
                      />
                      <Select
                        value={pricingForm.adminType}
                        onValueChange={(v: any) => setPricingForm({ ...pricingForm, adminType: v })}
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="%">%</SelectItem>
                          <SelectItem value="R$">R$</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">
                    Margem de Lucro (%)
                  </Label>
                  <Input
                    type="number"
                    value={pricingForm.profitMargin}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, profitMargin: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-3 border-t pt-4">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">
                    Opções Adicionais
                  </Label>
                  <div className="flex justify-between items-center bg-muted/20 p-3 rounded border">
                    <Label className="cursor-pointer">Valor de Promoção (R$)</Label>
                    <Input
                      type="number"
                      className="w-32 bg-background"
                      value={pricingForm.promoPrice}
                      onChange={(e) =>
                        setPricingForm({ ...pricingForm, promoPrice: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 mt-4 flex flex-col items-center relative overflow-hidden">
                <span className="text-sm text-primary/80 font-medium mb-1 uppercase tracking-wider">
                  Preço de Venda Sugerido
                </span>
                <span className="text-4xl font-bold text-primary tracking-tight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    finalPrice,
                  )}
                </span>
                {pricingForm.promoPrice > 0 && (
                  <span className="text-sm text-emerald-600 font-semibold mt-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Promoção:{' '}
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      pricingForm.promoPrice,
                    )}
                  </span>
                )}
              </div>

              {isBelowCost && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex flex-col gap-3 border border-destructive/30 mt-4 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="h-5 w-5" />
                    Aviso de Prejuízo Operacional
                  </div>
                  <p className="text-sm">
                    O preço de venda efetivo (
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      effectivePrice,
                    )}
                    ) está abaixo do custo total de entrada do produto (
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      totalCost,
                    )}
                    ).
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="ack-loss"
                      className="w-4 h-4 accent-destructive cursor-pointer"
                      checked={acknowledgeLoss}
                      onChange={(e) => setAcknowledgeLoss(e.target.checked)}
                    />
                    <Label
                      htmlFor="ack-loss"
                      className="text-sm cursor-pointer font-medium text-destructive"
                    >
                      Estou ciente do prejuízo e desejo aplicar o preço
                    </Label>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsPricingModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={savePricing}
                  className="gap-2"
                  disabled={isBelowCost && !acknowledgeLoss}
                >
                  <Check className="h-4 w-4" />
                  Aplicar Preço
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
