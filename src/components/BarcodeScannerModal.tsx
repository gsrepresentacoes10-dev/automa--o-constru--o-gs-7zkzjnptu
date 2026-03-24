import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, ScanLine } from 'lucide-react'

interface BarcodeScannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (barcode: string) => void
}

export function BarcodeScannerModal({ open, onOpenChange, onScan }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scanIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (open) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [open])

  const startCamera = async () => {
    setError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()

        // Use BarcodeDetector native API if available in the browser
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'ean_8', 'code_128'],
          })
          scanIntervalRef.current = window.setInterval(async () => {
            if (
              videoRef.current &&
              videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
            ) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current)
                if (barcodes.length > 0) {
                  onScan(barcodes[0].rawValue)
                  onOpenChange(false)
                }
              } catch (e) {
                console.error(e)
              }
            }
          }, 500)
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Câmera indisponível. Verifique as permissões do navegador.')
    }
  }

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const simulateScan = () => {
    setTimeout(() => {
      onScan('7891000000001') // Mock EAN Cimento CP II 50kg
      onOpenChange(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear Código de Barras</DialogTitle>
          <DialogDescription>Aponte a câmera para o código do produto.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          {!error ? (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video ref={videoRef} playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-primary/50 m-8 rounded-lg opacity-50" />
              <div className="absolute inset-x-0 top-1/2 h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]" />
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-muted rounded-lg w-full flex flex-col items-center">
              <Camera className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          <Button variant="secondary" onClick={simulateScan} className="w-full">
            <ScanLine className="w-4 h-4 mr-2" /> Simular Leitura (Demo)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
