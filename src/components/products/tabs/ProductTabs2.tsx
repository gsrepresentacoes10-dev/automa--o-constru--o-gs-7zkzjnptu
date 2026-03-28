import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { PRODUCT_UNITS } from '@/lib/constants'
import { SearchableSelect } from '../SearchableSelect'

export function CodesUnitsTab() {
  const { control } = useFormContext()
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
      <FormField
        control={control}
        name="barcode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Código de barras</FormLabel>
            <FormControl>
              <Input {...field} value={field.value || ''} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="barcode2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>2º Código de barras</FormLabel>
            <FormControl>
              <Input {...field} value={field.value || ''} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="barcode3"
        render={({ field }) => (
          <FormItem>
            <FormLabel>3º Código de barras</FormLabel>
            <FormControl>
              <Input {...field} value={field.value || ''} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="reference"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Referência</FormLabel>
            <FormControl>
              <Input {...field} value={field.value || ''} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="scaleReference"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Referência balança</FormLabel>
            <FormControl>
              <Input {...field} value={field.value || ''} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="unit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Unidade *</FormLabel>
            <SearchableSelect
              options={PRODUCT_UNITS}
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecione a unidade..."
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

export function AdvancedTab() {
  const { control } = useFormContext()
  const toggles = [
    { name: 'active', label: 'Ativo' },
    { name: 'compound', label: 'Composto' },
    { name: 'withVariations', label: 'Com variações' },
    { name: 'comboType', label: 'Tipo combo' },
    { name: 'uniqueType', label: 'Tipo único' },
    { name: 'posScale', label: 'Balança PDV' },
    { name: 'exportToScale', label: 'Exportar para Balança' },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
      {toggles.map((t) => (
        <FormField
          key={t.name}
          control={control}
          name={t.name}
          render={({ field }) => (
            <FormItem className="flex items-center justify-between border p-3 rounded-md">
              <FormLabel>{t.label}</FormLabel>
              <FormControl>
                <Switch checked={!!field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      ))}
    </div>
  )
}
