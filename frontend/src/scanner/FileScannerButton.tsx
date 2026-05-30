import { useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Spinner } from '@/components/ui'

const SCAN_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.AZTEC,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.PDF_417,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.RSS_14,
  Html5QrcodeSupportedFormats.RSS_EXPANDED,
]

// Hidden DOM element used by html5-qrcode for file scanning.
// Must exist in the document before calling scanFileV2.
const FILE_SCAN_CONTAINER_ID = 'file-scanner-hidden-container'

function ensureContainer(): HTMLElement {
  let el = document.getElementById(FILE_SCAN_CONTAINER_ID)
  if (!el) {
    el = document.createElement('div')
    el.id = FILE_SCAN_CONTAINER_ID
    el.style.display = 'none'
    document.body.appendChild(el)
  }
  return el
}

interface FileScannerButtonProps {
  onScan: (code: string) => void
  onError?: (message: string) => void
  label?: string
  className?: string
}

// Scan a barcode or QR code from an image file chosen by the user.
// No camera needed — works everywhere including desktop.
export function FileScannerButton({
  onScan,
  onError,
  label = 'Scan from Image',
  className = '',
}: FileScannerButtonProps) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!inputRef.current) return
    inputRef.current.value = '' // reset so same file can be picked again
    if (!file) return

    setScanning(true)
    ensureContainer()

    const scanner = new Html5Qrcode(FILE_SCAN_CONTAINER_ID, {
      verbose: false,
      formatsToSupport: SCAN_FORMATS,
    })

    try {
      const result = await scanner.scanFileV2(file, false)
      onScan(result.decodedText)
    } catch {
      onError?.('No barcode or QR code found in that image. Try a clearer photo.')
    } finally {
      try { scanner.clear() } catch { /* ignore */ }
      setScanning(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        disabled={scanning}
        onClick={() => inputRef.current?.click()}
        className={className}>
        {scanning ? <Spinner size={14} /> : null}
        {label}
      </button>
    </>
  )
}
