/**
 * Shared PDF utilities for all AIOS LeadMagnet PDF generators
 */

// Cache the logo so it's only fetched once per session
let _logoCache = null

/**
 * Loads the Partflow logo from /partflow-logo.png as a base64 data URL.
 * Returns null if the logo cannot be loaded (PDF will still be generated without it).
 */
export async function loadPartflowLogo() {
  if (_logoCache !== null) return _logoCache
  try {
    const response = await fetch('/partflow-logo.png')
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        _logoCache = reader.result
        resolve(reader.result)
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/** Logo dimensions for jsPDF (mm), based on original 570×211 px */
export const LOGO_PDF = { w: 48, h: 18 }

/** Current year for footers */
export const CURRENT_YEAR = new Date().getFullYear()

/**
 * Draws the standard Partflow page footer.
 * Call this before doc.addPage() and at the end of the last page.
 */
export function addStandardFooter(doc, moduleLabel = '') {
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15

  doc.setFillColor(245, 245, 245)
  doc.rect(0, pageHeight - 18, pageWidth, 18, 'F')
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(0, pageHeight - 18, pageWidth, pageHeight - 18)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)

  doc.text(`\u00A9 ${CURRENT_YEAR} Partflow.net`, margin, pageHeight - 10)
  doc.text('info@partflow.net  |  +49 6331 7296114  |  www.partflow.net',
    pageWidth / 2, pageHeight - 10, { align: 'center' })
  if (moduleLabel) {
    doc.text(moduleLabel, pageWidth - margin, pageHeight - 10, { align: 'right' })
  }
}

/**
 * Adds page numbers to all pages (call after all pages are created).
 */
export function addPageNumbers(doc) {
  const total = doc.internal.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(160, 160, 160)
    doc.text(`Seite ${i} / ${total}`, pageWidth - 15, pageHeight - 4, { align: 'right' })
  }
}
