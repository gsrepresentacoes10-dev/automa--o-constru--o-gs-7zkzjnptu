import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Printer } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Product } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PrintInventoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
}

export function PrintInventoryModal({ open, onOpenChange, products }: PrintInventoryModalProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [printBrand, setPrintBrand] = useState('all')
  const [printCategory, setPrintCategory] = useState('all')
  const [printProductGroup, setPrintProductGroup] = useState('all')

  const uniqueBrands = useMemo(() => {
    const brands = products.map((p) => p.brand).filter(Boolean) as string[]
    return Array.from(new Set(brands)).sort()
  }, [products])

  const uniqueCategories = useMemo(() => {
    const cats = products.map((p) => p.category).filter(Boolean) as string[]
    return Array.from(new Set(cats)).sort()
  }, [products])

  const filteredForPrintProducts = useMemo(() => {
    const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name))
    return sortedProducts.filter((p) => {
      const matchBrand = printBrand === 'all' || p.brand === printBrand
      const matchCategory = printCategory === 'all' || p.category === printCategory
      return matchBrand && matchCategory
    })
  }, [products, printBrand, printCategory])

  const handlePrint = () => {
    setIsPrinting(true)
    document.body.classList.add('printing-inventory')

    const afterPrint = () => {
      document.body.classList.remove('printing-inventory')
      setIsPrinting(false)
      onOpenChange(false)
      window.removeEventListener('afterprint', afterPrint)
    }
    window.addEventListener('afterprint', afterPrint)

    setTimeout(() => {
      window.print()
      // Fallback timeout in case the print dialog doesn't trigger the afterprint event
      setTimeout(() => {
        document.body.classList.remove('printing-inventory')
        setIsPrinting(false)
        onOpenChange(false)
      }, 1500)
    }, 300)
  }

  // Cleanup effect in case component unmounts unexpectedly
  useEffect(() => {
    return () => {
      document.body.classList.remove('printing-inventory')
    }
  }, [])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Imprimir Relatório de Inventário</DialogTitle>
            <DialogDescription>Filtre a lista de produtos que deseja auditar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Marca</Label>
              <Select value={printBrand} onValueChange={setPrintBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as marcas</SelectItem>
                  {uniqueBrands.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grupo (Categoria)</Label>
              <Select value={printCategory} onValueChange={setPrintCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os grupos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os grupos</SelectItem>
                  {uniqueCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grupo de Produtos (Subgrupo)</Label>
              <Select value={printProductGroup} onValueChange={setPrintProductGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Printer className="w-4 h-4 mr-2" /> Confirmar e Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isPrinting &&
        createPortal(
          <div className="inventory-report bg-white text-black p-8 w-full min-h-screen font-sans">
            <div className="mb-6">
              <h1 className="text-2xl font-bold uppercase tracking-wider border-b-2 border-black pb-2 mb-2">
                Relatório de Inventário de Estoque
              </h1>
              <p className="text-sm text-gray-600">
                <strong>Data da Geração:</strong>{' '}
                {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {(printBrand !== 'all' || printCategory !== 'all') && (
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Filtros aplicados:</strong>
                  {printBrand !== 'all' ? ` Marca: ${printBrand}` : ''}
                  {printBrand !== 'all' && printCategory !== 'all' ? ' | ' : ''}
                  {printCategory !== 'all' ? ` Grupo: ${printCategory}` : ''}
                </p>
              )}
            </div>

            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border border-black p-2 text-left bg-gray-100 font-bold">
                    Produto
                  </th>
                  <th className="border border-black p-2 text-left bg-gray-100 font-bold">
                    Código (SKU)
                  </th>
                  <th className="border border-black p-2 text-left bg-gray-100 font-bold">Marca</th>
                  <th className="border border-black p-2 text-left bg-gray-100 font-bold">Grupo</th>
                  <th className="border border-black p-2 text-center bg-gray-100 font-bold">
                    Estoque Atual
                  </th>
                  <th className="border border-black p-2 text-center bg-gray-100 font-bold w-32">
                    Contagem Física
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredForPrintProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="border border-gray-400 p-2">{p.name}</td>
                    <td className="border border-gray-400 p-2">{p.sku}</td>
                    <td className="border border-gray-400 p-2">{p.brand || '-'}</td>
                    <td className="border border-gray-400 p-2">{p.category}</td>
                    <td className="border border-gray-400 p-2 text-center font-semibold">
                      {p.stock}
                    </td>
                    <td className="border border-gray-400 p-2"></td>
                  </tr>
                ))}
                {filteredForPrintProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="border border-gray-400 p-4 text-center italic text-gray-500"
                    >
                      Nenhum produto encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>,
          document.body,
        )}
    </>
  )
}
