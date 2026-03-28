import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { UploadCloud, X } from 'lucide-react'

export function DimensionsTab() {
  const { control, watch } = useFormContext()
  const hasDimensions = watch('hasDimensions')
  const forProduction = watch('forProduction')
  return (
    <div className="space-y-4 py-4">
      <FormField
        control={control}
        name="hasDimensions"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between border p-3 rounded-md">
            <FormLabel>Tipo dimensão?</FormLabel>
            <FormControl>
              <Switch checked={!!field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      {hasDimensions && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="thickness"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Espessura (mm)</FormLabel>
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
            name="width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Largura (cm)</FormLabel>
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
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Altura (cm)</FormLabel>
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
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comprimento (m)</FormLabel>
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
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (kg)</FormLabel>
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
            name="grossWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso bruto (kg)</FormLabel>
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
        </div>
      )}
      <div className="pt-4 border-t space-y-4">
        <FormField
          control={control}
          name="forProduction"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between border p-3 rounded-md">
              <FormLabel>Para produção?</FormLabel>
              <FormControl>
                <Switch checked={!!field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {forProduction && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="storageLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local de armazenamento</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="warrantyPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo de garantia (dias)</FormLabel>
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
      </div>
    </div>
  )
}

export function MediaNotesTab() {
  const { control, watch, setValue } = useFormContext()
  const images = watch('images') || []
  const obs = watch('observations') || ['', '', '', '']

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (images.length >= 5) return
    const newImage = 'https://img.usecurling.com/p/200/200?q=tools&seed=' + Math.random()
    setValue('images', [...images, newImage])
  }

  const removeImg = (idx: number) => {
    setValue(
      'images',
      images.filter((_: any, i: number) => i !== idx),
    )
  }

  const updateObs = (idx: number, val: string) => {
    const newObs = [...obs]
    newObs[idx] = val
    setValue('observations', newObs)
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <FormLabel>Imagens do Produto (Máx 5)</FormLabel>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed rounded-lg p-6 mt-2 text-center text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => {
            if (images.length < 5)
              setValue('images', [
                ...images,
                'https://img.usecurling.com/p/200/200?q=hardware&seed=' + Math.random(),
              ])
          }}
        >
          <UploadCloud className="mx-auto h-8 w-8 mb-2" />
          <p>Arraste e solte imagens aqui ou clique para fazer upload</p>
          <p className="text-xs mt-1">PNG, JPG até 5MB</p>
        </div>
        {images.length > 0 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {images.map((img: string, i: number) => (
              <div
                key={i}
                className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden border group"
              >
                <img src={img} alt="" className="object-cover w-full h-full" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImg(i)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <FormItem key={i}>
            <FormLabel>Observação {i + 1}</FormLabel>
            <FormControl>
              <Textarea
                value={obs[i] || ''}
                onChange={(e) => updateObs(i, e.target.value)}
                rows={2}
              />
            </FormControl>
          </FormItem>
        ))}
      </div>
    </div>
  )
}
