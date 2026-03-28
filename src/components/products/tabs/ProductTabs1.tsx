import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { PRODUCT_CATEGORIES, PRODUCT_BRANDS } from '@/lib/constants'
import { AlertCircle } from 'lucide-react'
import { SearchableSelect } from '../SearchableSelect'

export function BasicTab() {
  const { control } = useFormContext()
  return (
    <div className="space-y-4 py-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Produto *</FormLabel>
            <FormControl>
              <Input maxLength={120} {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="sku"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SKU / Código Interno</FormLabel>
            <FormControl>
              <Input {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

export function PricesTab() {
  const { control, watch } = useFormContext()
  const costPrice = watch('costPrice') || 0
  const profitMargin = watch('profitMargin') || 0
  const price = watch('price') || 0

  const calcPrice = costPrice + (costPrice * profitMargin) / 100
  const diff = Math.abs(price - calcPrice) > 0.01

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
      <FormField
        control={control}
        name="costPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Valor de compra (R$)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="profitMargin"
        render={({ field }) => (
          <FormItem>
            <FormLabel>% Lucro</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              Valor de venda (R$) *{' '}
              {diff && (
                <AlertCircle className="h-4 w-4 text-amber-500" title="Valor difere do calculado" />
              )}
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="minSalePrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Valor mín. de venda (R$)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="wholesalePrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Valor de atacado (R$)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="wholesaleQuantity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Qtd. para atacado</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}

export function StockCategoryTab() {
  const { control, watch } = useFormContext()
  const manageStock = watch('manageStock')
  return (
    <div className="space-y-4 py-4">
      <FormField
        control={control}
        name="manageStock"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between border p-3 rounded-md">
            <FormLabel>Gerenciar estoque?</FormLabel>
            <FormControl>
              <Switch checked={!!field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      {manageStock && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque Inicial</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="minStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque Mínimo</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="expirationAlertDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alerta validade (dias)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria *</FormLabel>
              <SearchableSelect
                options={PRODUCT_CATEGORIES}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecione a categoria..."
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca *</FormLabel>
              <SearchableSelect
                options={PRODUCT_BRANDS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecione a marca..."
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
