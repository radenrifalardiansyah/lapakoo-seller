import jsPDF from 'jspdf'
import autoTable, { type RowInput, type Styles, type UserOptions } from 'jspdf-autotable'

export type PdfOrientation = 'portrait' | 'landscape'

export interface PdfColumn {
  header: string
  /** Optional explicit column width in mm */
  width?: number
  /** Optional column alignment, defaults to 'left' */
  align?: 'left' | 'right' | 'center'
}

export interface PdfSummaryItem {
  label: string
  value: string
}

export interface PdfExportOptions {
  /** File name (without extension). ".pdf" is appended automatically. */
  fileName: string
  /** Document title shown in the page header. */
  title: string
  /** Optional subtitle (sub-heading) under the title. */
  subtitle?: string
  /** Store / tenant name for the header brand row. */
  storeName?: string
  /** Page orientation. Defaults to 'landscape' for wide tables. */
  orientation?: PdfOrientation
  /** Column definitions for the autotable. */
  columns: PdfColumn[]
  /** Data rows, aligned with `columns`. */
  rows: RowInput[]
  /** Optional summary rows shown above the table (e.g. Total Omzet: Rp ...). */
  summary?: PdfSummaryItem[]
  /** Optional footnote shown below the table. */
  footnote?: string
}

const BRAND_COLOR: [number, number, number] = [99, 102, 241] // indigo-500
const MUTED_COLOR: [number, number, number] = [113, 113, 122] // zinc-500
const HEADER_FILL: [number, number, number] = [243, 244, 246] // zinc-100

function formatTimestamp(): string {
  const d = new Date()
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function fileStamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

/**
 * Render a branded PDF with a header, optional summary block, an autotable, and
 * paginated footers. Triggers download as `${fileName}.pdf`.
 */
export function exportPdf(opts: PdfExportOptions): void {
  const orientation = opts.orientation ?? 'landscape'
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND_COLOR)
  doc.rect(0, 0, pageWidth, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(24, 24, 27)
  doc.text(opts.title, margin, margin + 6)

  if (opts.subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...MUTED_COLOR)
    doc.text(opts.subtitle, margin, margin + 11)
  }

  // Right side: store + timestamp
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED_COLOR)
  const rightX = pageWidth - margin
  if (opts.storeName) {
    doc.text(opts.storeName, rightX, margin + 6, { align: 'right' })
  }
  doc.text(`Diunduh: ${formatTimestamp()}`, rightX, margin + 11, { align: 'right' })

  let cursorY = margin + (opts.subtitle ? 16 : 12)

  // ── Summary block ─────────────────────────────────────────────────────────
  if (opts.summary && opts.summary.length > 0) {
    const cols = Math.min(opts.summary.length, 4)
    const blockHeight = 14
    const cellWidth = (pageWidth - margin * 2) / cols
    doc.setDrawColor(229, 231, 235)
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, blockHeight, 1.5, 1.5, 'FD')

    opts.summary.slice(0, cols).forEach((item, i) => {
      const x = margin + i * cellWidth + 4
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...MUTED_COLOR)
      doc.text(item.label.toUpperCase(), x, cursorY + 5)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(24, 24, 27)
      doc.text(item.value, x, cursorY + 11)
    })

    cursorY += blockHeight + 4
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  const headers = opts.columns.map(c => c.header)
  const columnStyles: Record<number, Partial<Styles>> = {}
  opts.columns.forEach((c, i) => {
    const s: Partial<Styles> = {}
    if (c.width) s.cellWidth = c.width
    if (c.align) s.halign = c.align
    columnStyles[i] = s
  })

  const tableOpts: UserOptions = {
    startY: cursorY,
    head: [headers],
    body: opts.rows,
    margin: { left: margin, right: margin, bottom: 18 },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
      textColor: [24, 24, 27],
    },
    headStyles: {
      fillColor: HEADER_FILL,
      textColor: [24, 24, 27],
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: [209, 213, 219],
    },
    alternateRowStyles: {
      fillColor: [250, 250, 251],
    },
    columnStyles,
    didDrawPage: data => {
      // Footer with page number
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
      const currentPage = data.pageNumber
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...MUTED_COLOR)
      doc.text(
        `Halaman ${currentPage} dari ${pageCount}`,
        pageWidth - margin,
        pageHeight - 7,
        { align: 'right' }
      )
      if (opts.footnote) {
        doc.text(opts.footnote, margin, pageHeight - 7)
      }
    },
  }

  autoTable(doc, tableOpts)

  doc.save(`${opts.fileName}.pdf`)
}

export function formatRupiah(v: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(v)
}
