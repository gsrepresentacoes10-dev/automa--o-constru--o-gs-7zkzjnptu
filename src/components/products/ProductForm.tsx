import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BasicTab, PricesTab, StockCategoryTab } from './tabs/ProductTabs1'
import { CodesUnitsTab, AdvancedTab } from './tabs/ProductTabs2'
import { DimensionsTab, MediaNotesTab } from './tabs/ProductTabs3'
import { Product } from '@/context/AppContext'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(120, 'Máximo 120 caracteres'),
  price: z.number().min(0.01, 'Preço deve ser maior que 0'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  brand: z.string().min(1, 'Marca é obrigatória'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  sku: z.string().optional(),
  costPrice: z.number().optional().default(0),
  profitMargin: z.number().optional().default(0),
  minSalePrice: z.number().optional().default(0),
  wholesalePrice: z.number().optional().default(0),
  wholesaleQuantity: z.number().optional().default(0),
  manageStock: z.boolean().optional().default(false),
  stock: z.number().optional().default(0),
  minStock: z.number().optional().default(0),
  expirationAlertDays: z.number().optional().default(0),
  barcode: z.string().optional(),
  barcode2: z.string().optional(),
  barcode3: z.string().optional(),
  reference: z.string().optional(),
  scaleReference: z.string().optional(),
  active: z.boolean().optional().default(true),
  compound: z.boolean().optional().default(false),
  withVariations: z.boolean().optional().default(false),
  comboType: z.boolean().optional().default(false),
  uniqueType: z.boolean().optional().default(false),
  posScale: z.boolean().optional().default(false),
  exportToScale: z.boolean().optional().default(false),
  hasDimensions: z.boolean().optional().default(false),
  thickness: z.number().optional().default(0),
  width: z.number().optional().default(0),
  height: z.number().optional().default(0),
  length: z.number().optional().default(0),
  weight: z.number().optional().default(0),
  grossWeight: z.number().optional().default(0),
  forProduction: z.boolean().optional().default(false),
  storageLocation: z.string().optional(),
  warrantyPeriod: z.number().optional().default(0),
  images: z.array(z.string()).optional().default([]),
  observations: z.array(z.string()).optional().default(['', '', '', '']),
})

type FormData = z.infer<typeof schema>

interface ProductFormProps {
  product?: Product | null
  onSave: (data: FormData) => void
  onCancel: () => void
  readOnly?: boolean
}

export function ProductForm({ product, onSave, onCancel, readOnly }: ProductFormProps) {
  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          ...product,
          profitMargin: product.profitMargin || 0,
          active: product.active ?? true,
          observations: product.observations || ['', '', '', ''],
          images: product.images || [],
        }
      : {
          active: true,
          manageStock: false,
          stock: 0,
          minStock: 0,
          costPrice: 0,
          profitMargin: 0,
          price: 0,
          observations: ['', '', '', ''],
          images: [],
        },
  })

  return (
    <Form {...methods}>
      <form onSubmit={methods.handleSubmit(onSave)} className="space-y-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-4 md:flex md:flex-wrap h-auto p-1 mb-4 gap-1 bg-muted rounded-lg">
            <TabsTrigger value="basic" className="text-xs h-8 flex-1">
              Dados Básicos
            </TabsTrigger>
            <TabsTrigger value="prices" className="text-xs h-8 flex-1">
              Preços
            </TabsTrigger>
            <TabsTrigger value="stock" className="text-xs h-8 flex-1">
              Estoque
            </TabsTrigger>
            <TabsTrigger value="codes" className="text-xs h-8 flex-1">
              Códigos
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs h-8 flex-1">
              Avançado
            </TabsTrigger>
            <TabsTrigger value="dimensions" className="text-xs h-8 flex-1">
              Dimensões
            </TabsTrigger>
            <TabsTrigger value="media" className="text-xs h-8 flex-1">
              Mídia/Obs
            </TabsTrigger>
          </TabsList>

          <div className={readOnly ? 'pointer-events-none opacity-90' : ''}>
            <TabsContent value="basic" className="mt-0">
              <BasicTab />
            </TabsContent>
            <TabsContent value="prices" className="mt-0">
              <PricesTab />
            </TabsContent>
            <TabsContent value="stock" className="mt-0">
              <StockCategoryTab />
            </TabsContent>
            <TabsContent value="codes" className="mt-0">
              <CodesUnitsTab />
            </TabsContent>
            <TabsContent value="advanced" className="mt-0">
              <AdvancedTab />
            </TabsContent>
            <TabsContent value="dimensions" className="mt-0">
              <DimensionsTab />
            </TabsContent>
            <TabsContent value="media" className="mt-0">
              <MediaNotesTab />
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            className={readOnly ? 'pointer-events-auto' : ''}
          >
            {readOnly ? 'Fechar' : 'Cancelar'}
          </Button>
          {!readOnly && <Button type="submit">Salvar Produto</Button>}
        </div>
      </form>
    </Form>
  )
}
