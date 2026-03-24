import { useState, useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useAppContext, PaymentMethod } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, QrCode, Copy, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'

export default function Checkout() {
  const { type, id } = useParams<{ type: 'quote' | 'sale'; id: string }>()
  const { quotes, sales, processOnlinePayment } = useAppContext()

  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')

  const targetData = useMemo(() => {
    if (type === 'quote') {
      return quotes.find((q) => q.id === id)
    } else if (type === 'sale') {
      return sales.find((s) => s.id === id)
    }
    return null
  }, [type, id, quotes, sales])

  if (!type || !id || (type !== 'quote' && type !== 'sale')) {
    return <Navigate to="/404" />
  }

  if (!targetData) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-8">
          <CardTitle className="text-destructive mb-2">Registro Não Encontrado</CardTitle>
          <CardDescription>O link acessado é inválido ou já expirou.</CardDescription>
        </Card>
      </div>
    )
  }

  // Pre-checks for validity
  const isQuote = type === 'quote'
  const isSale = type === 'sale'
  const alreadyProcessed =
    (isQuote && ['Aprovado', 'Convertido', 'Cancelado'].includes(targetData.status)) ||
    (isSale && targetData.status === 'Pago')

  const handleSimulatePayment = () => {
    setIsProcessing(true)
    // Simulate gateway delay
    setTimeout(() => {
      processOnlinePayment(type, id, paymentMethod)
      setIsProcessing(false)
      setIsSuccess(true)
    }, 2000)
  }

  const handleCopyPix = () => {
    navigator.clipboard.writeText('00020126580014br.gov.bcb.pix0136-mock-checkout-key-1234')
    toast({ title: 'Código Copiado', description: 'Chave PIX Copia e Cola pronta para uso.' })
  }

  if (alreadyProcessed && !isSuccess) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12 px-6">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <CardTitle className="text-xl mb-2">Pagamento já realizado!</CardTitle>
          <CardDescription className="mb-6">
            O {isQuote ? 'orçamento' : 'pedido'} {id} já consta como concluído em nosso sistema.
          </CardDescription>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12 px-6 animate-in fade-in zoom-in duration-500">
          <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl mb-2 text-emerald-950">Pagamento Aprovado</CardTitle>
          <CardDescription className="mb-6 text-emerald-800/80">
            Seu pagamento foi confirmado com sucesso. O status do seu{' '}
            {isQuote ? 'orçamento' : 'pedido'} foi atualizado!
          </CardDescription>
          <div className="bg-white border rounded-lg p-4 text-left">
            <div className="text-sm text-muted-foreground mb-1">Comprovante de Transação</div>
            <div className="font-medium text-lg mb-2">{formatCurrency(targetData.total)}</div>
            <div className="text-xs flex justify-between border-t pt-2 mt-2">
              <span className="text-muted-foreground">ID do Pedido:</span>
              <span className="font-mono">{targetData.id}</span>
            </div>
            <div className="text-xs flex justify-between mt-1">
              <span className="text-muted-foreground">Forma:</span>
              <span className="font-mono">{paymentMethod}</span>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-primary flex items-center justify-center gap-3">
            <ShieldCheck className="h-8 w-8" /> Checkout Seguro
          </h1>
          <p className="text-muted-foreground mt-2">ConstruMaster Materiais de Construção</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="shadow-md border-primary/10">
              <CardHeader className="bg-primary/5 pb-4 border-b">
                <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
                <CardDescription>Confira os itens antes de pagar</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b bg-white text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Identificação:</span>
                    <span className="font-medium">{targetData.id}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium truncate max-w-[200px]">
                      {targetData.customer || 'Consumidor Final'}
                    </span>
                  </div>
                  {isQuote && (targetData as any).validUntil && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Validade:</span>
                      <span className="font-medium">
                        {new Date((targetData as any).validUntil).toLocaleDateString('pt-BR', {
                          timeZone: 'UTC',
                        })}
                      </span>
                    </div>
                  )}
                  {isSale && (targetData as any).dueDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vencimento Original:</span>
                      <span className="font-medium text-destructive">
                        {new Date((targetData as any).dueDate).toLocaleDateString('pt-BR', {
                          timeZone: 'UTC',
                        })}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 max-h-64 overflow-y-auto space-y-3 bg-muted/5">
                  {targetData.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm items-center">
                      <div className="flex-1 pr-4">
                        <p className="font-medium leading-tight">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity}x {formatCurrency(item.product.price)}
                        </p>
                      </div>
                      <div className="font-semibold text-right">{formatCurrency(item.total)}</div>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-white border-t">
                  {targetData.discount ? (
                    <div className="flex justify-between text-sm mb-2 text-red-500">
                      <span>Desconto Aplicado</span>
                      <span>-{formatCurrency(targetData.discount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-lg font-bold">Total a Pagar</span>
                    <span className="text-2xl font-black text-primary">
                      {formatCurrency(targetData.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Module */}
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Forma de Pagamento</CardTitle>
                <CardDescription>Escolha como deseja prosseguir</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  defaultValue="pix"
                  onValueChange={(v) => setPaymentMethod(v === 'pix' ? 'PIX' : 'Cartão de Crédito')}
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                    <TabsTrigger value="pix" className="text-base gap-2">
                      <QrCode className="h-4 w-4" /> PIX
                    </TabsTrigger>
                    <TabsTrigger value="credit" className="text-base gap-2">
                      <CreditCard className="h-4 w-4" /> Cartão
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="pix"
                    className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4"
                  >
                    <div className="flex flex-col items-center justify-center p-6 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <div className="bg-white p-3 rounded-2xl shadow-sm border border-emerald-200 mb-4">
                        <QrCode className="w-48 h-48 text-emerald-950" strokeWidth={1.2} />
                      </div>
                      <p className="text-sm font-medium text-center text-emerald-900 mb-4">
                        Escaneie o QR Code com o app do seu banco ou copie a chave abaixo:
                      </p>
                      <div className="flex w-full gap-2">
                        <Input
                          readOnly
                          value="00020126580014br.gov.bcb.pix0136-mock-checkout-key-1234"
                          className="font-mono text-xs bg-white"
                        />
                        <Button variant="outline" onClick={handleCopyPix} className="shrink-0">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleSimulatePayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...
                        </>
                      ) : (
                        'Simular Pagamento PIX'
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent
                    value="credit"
                    className="space-y-4 mt-0 animate-in fade-in slide-in-from-bottom-4"
                  >
                    <div className="space-y-4 bg-muted/10 p-5 rounded-xl border">
                      <div className="space-y-2">
                        <Label>Número do Cartão</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="0000 0000 0000 0000" className="pl-9" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Nome Impresso no Cartão</Label>
                        <Input placeholder="NOME DO TITULAR" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Validade</Label>
                          <Input placeholder="MM/AA" />
                        </div>
                        <div className="space-y-2">
                          <Label>CVV</Label>
                          <Input placeholder="123" type="password" maxLength={4} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Parcelamento</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          <option>1x de {formatCurrency(targetData.total)} sem juros</option>
                          <option>2x de {formatCurrency(targetData.total / 2)} sem juros</option>
                          <option>3x de {formatCurrency(targetData.total / 3)} sem juros</option>
                        </select>
                      </div>
                    </div>
                    <Button
                      className="w-full h-14 text-lg"
                      onClick={handleSimulatePayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...
                        </>
                      ) : (
                        'Pagar com Cartão'
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
