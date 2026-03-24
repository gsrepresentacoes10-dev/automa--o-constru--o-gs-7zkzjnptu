import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Customer } from '@/context/AppContext'

export function CustomerCombobox({
  customers,
  value,
  onChange,
  allowWalkIn = false,
  placeholder,
}: {
  customers: Customer[]
  value: string
  onChange: (value: string) => void
  allowWalkIn?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)

  const selectedName = React.useMemo(() => {
    if (value === 'none' && allowWalkIn) return 'Consumidor Final (Sem Cadastro)'
    if (value === 'none' && !allowWalkIn) return placeholder || 'Selecione um cliente...'
    const c = customers.find((c) => c.id === value)
    return c ? c.name : placeholder || 'Selecione um cliente...'
  }, [value, customers, allowWalkIn, placeholder])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selectedName}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nome ou doc..." />
          <CommandList>
            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            <CommandGroup>
              {allowWalkIn && (
                <CommandItem
                  value="none"
                  onSelect={() => {
                    onChange('none')
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      value === 'none' ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  Consumidor Final (Sem Cadastro)
                </CommandItem>
              )}
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={`${customer.name} ${customer.document}`}
                  onSelect={() => {
                    onChange(customer.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      value === customer.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate">{customer.name}</span>
                    <span className="text-xs text-muted-foreground">{customer.document}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
