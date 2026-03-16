import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from './riskCalculations'
import { loadPartflowLogo, LOGO_PDF, CURRENT_YEAR, addStandardFooter, addPageNumbers } from './pdfHelpers'

const C = {
  blue:      [0, 90, 160],
  blueLight: [0, 122, 204],
  critical:  [185, 28, 28],
  high:      [194, 65, 12],
  medium:    [161, 98, 7],
  low:       [21, 128, 61],
  purple:    [109, 40, 217],
  gray:      [97, 97, 97],
  grayLight: [245, 245, 245],
  grayMid:   [200, 200, 200],
  black:     [33, 33, 33],
  white:     [255, 255, 255],
}

export async function generateBomRiskPDF({ assessments, stats, recommendations, fileName }) {
  const logoDataUrl = await loadPartflowLogo()

  const doc = new jsPDF()
  const W = doc.internal.pageSize.width
  const H = doc.internal.pageSize.height
  const M = 18
  let y = 0

  const checkBreak = (needed = 30) => {
    if (y + needed > H - 22) {
      addStandardFooter(doc, 'BOM Risk Assessment')
      doc.addPage()
      y = 18
      return true
    }
    return false
  }

  const sectionTitle = (title) => {
    checkBreak(18)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.black)
    doc.text(title, M, y)
    y += 2
    doc.setDrawColor(...C.blueLight)
    doc.setLineWidth(0.4)
    doc.line(M, y, W - M, y)
    y += 8
  }

  // ─────────────────────────────────────────
  // SEITE 1: HEADER + EXECUTIVE SUMMARY
  // ─────────────────────────────────────────

  doc.setFillColor(...C.blue)
  doc.rect(0, 0, W, 46, 'F')

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', M, 9, LOGO_PDF.w, LOGO_PDF.h)
  } else {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.white)
    doc.text('PARTFLOW', M + 2, 22)
  }

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('BOM Risk Assessment', W / 2, 20, { align: 'center' })
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Supply Chain Risikoanalyse  |  Partflow.net', W / 2, 30, { align: 'center' })

  y = 54

  // Metadaten-Box
  doc.setFillColor(...C.grayLight)
  doc.setDrawColor(...C.grayMid)
  doc.setLineWidth(0.3)
  doc.rect(M, y, W - 2 * M, 22, 'FD')
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.black)
  doc.text('Datei:', M + 5, y + 8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text(String(fileName || '—').substring(0, 70), M + 22, y + 8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.black)
  doc.text('Datum:', M + 5, y + 16)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text(new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }), M + 22, y + 16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.black)
  doc.text('Positionen:', W / 2 + 5, y + 8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text(`${stats.totalParts} analysiert`, W / 2 + 30, y + 8)

  y += 30

  sectionTitle('Executive Summary')

  // 4 Kennzahlen-Boxen
  const bw = (W - 2 * M - 10) / 2
  const bh = 34

  // Box 1: Risiko-Score
  doc.setFillColor(254, 226, 226)
  doc.setDrawColor(...C.critical)
  doc.setLineWidth(0.4)
  doc.rect(M, y, bw, bh, 'FD')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.critical)
  doc.text('DURCHSCHN. RISIKO-SCORE', M + 5, y + 9)
  doc.setFontSize(26)
  doc.text(`${stats.avgRiskScore}`, M + 5, y + 26)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('/ 100', M + 28, y + 26)

  // Box 2: Kritische Positionen
  doc.setFillColor(255, 237, 213)
  doc.setDrawColor(...C.high)
  doc.rect(M + bw + 10, y, bw, bh, 'FD')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.high)
  doc.text('KRITISCHE POSITIONEN', M + bw + 15, y + 9)
  doc.setFontSize(26)
  doc.text(`${stats.byCategory.CRITICAL + stats.byCategory.HIGH}`, M + bw + 15, y + 26)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`${stats.byCategory.CRITICAL} Kritisch  /  ${stats.byCategory.HIGH} Hoch`, M + bw + 15, y + 32)

  y += bh + 5

  // Box 3: Risikokosten
  doc.setFillColor(243, 232, 255)
  doc.setDrawColor(...C.purple)
  doc.rect(M, y, bw, bh, 'FD')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.purple)
  doc.text('GESCHAETZTE RISIKOKOSTEN', M + 5, y + 9)
  doc.setFontSize(18)
  doc.text(formatCurrency(stats.totalCostOfInaction), M + 5, y + 24)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text('pro Jahr bei Nichtbehandlung', M + 5, y + 31)

  // Box 4: ROI
  doc.setFillColor(220, 252, 231)
  doc.setDrawColor(...C.low)
  doc.rect(M + bw + 10, y, bw, bh, 'FD')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.low)
  doc.text('MASSNAHMEN-ROI', M + bw + 15, y + 9)
  doc.setFontSize(26)
  doc.text(String(stats.overallROI || '—'), M + bw + 15, y + 26)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Return on Investment', M + bw + 15, y + 32)

  y += bh + 12

  // ── RISIKOVERTEILUNG ──
  sectionTitle('Risikoverteilung')

  const riskData = [
    { label: 'KRITISCH', count: stats.byCategory.CRITICAL, color: C.critical },
    { label: 'HOCH',     count: stats.byCategory.HIGH,     color: C.high },
    { label: 'MITTEL',   count: stats.byCategory.MEDIUM,   color: C.medium },
    { label: 'NIEDRIG',  count: stats.byCategory.LOW,      color: C.low },
  ]

  const barW = W - 2 * M
  let xOff = M
  riskData.forEach(item => {
    const pct = (item.count / stats.totalParts) * 100
    const seg = (barW * pct) / 100
    if (seg > 0) {
      doc.setFillColor(...item.color)
      doc.rect(xOff, y, seg, 8, 'F')
      xOff += seg
    }
  })
  y += 13

  let legendX = M
  riskData.forEach(item => {
    const pct = ((item.count / stats.totalParts) * 100).toFixed(1)
    doc.setFillColor(...item.color)
    doc.rect(legendX, y, 4, 4, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.black)
    doc.text(`${item.label}: ${item.count} (${pct}%)`, legendX + 6, y + 3.5)
    legendX += 46
  })
  y += 12

  // ── KRITISCHE PROBLEME ──
  sectionTitle('Kritische Problempunkte')

  const issues = [
    { title: 'Single-Source Positionen', count: stats.keyIssues.singleSourceParts,
      desc: 'Nur ein Lieferant — Hohes Ausfall- und Engpassrisiko', color: C.critical },
    { title: 'Lange Lieferzeiten (> 12 Wochen)', count: stats.keyIssues.longLeadTimeParts,
      desc: 'Gefaehrdet termingerechte Produktion und Liefertreue',  color: C.high },
    { title: 'EOL / Abgekuendigt', count: stats.keyIssues.eolParts,
      desc: 'Teile nicht mehr lieferbar — Handlungsbedarf sofort',   color: C.purple },
  ]

  issues.forEach(issue => {
    checkBreak(24)
    doc.setFillColor(252, 250, 250)
    doc.setDrawColor(...issue.color)
    doc.setLineWidth(0.3)
    doc.rect(M, y, W - 2 * M, 20, 'FD')
    doc.setFillColor(...issue.color)
    doc.rect(M, y, 3, 20, 'F')
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...issue.color)
    doc.text(String(issue.count), M + 10, y + 13)
    doc.setFontSize(10)
    doc.setTextColor(...C.black)
    doc.text(issue.title, M + 25, y + 8)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text(issue.desc, M + 25, y + 15)
    y += 24
  })

  // ─────────────────────────────────────────
  // SEITE 2: EMPFEHLUNGEN
  // ─────────────────────────────────────────
  addStandardFooter(doc, 'BOM Risk Assessment')
  doc.addPage()
  y = 18

  // Mini-Header
  doc.setFillColor(...C.blue)
  doc.rect(0, 0, W, 12, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Priorisierte Handlungsempfehlungen', M, 8)
  y = 22

  recommendations.forEach((rec) => {
    checkBreak(42)

    const bgColor = rec.impact === 'CRITICAL' ? [254, 226, 226]
                  : rec.impact === 'HIGH'     ? [255, 237, 213]
                  :                             [254, 249, 195]
    const bdColor = rec.impact === 'CRITICAL' ? C.critical
                  : rec.impact === 'HIGH'     ? C.high
                  :                             C.medium

    doc.setFillColor(...bgColor)
    doc.setDrawColor(...bdColor)
    doc.setLineWidth(0.3)
    doc.rect(M, y, W - 2 * M, 36, 'FD')

    doc.setFillColor(...bdColor)
    doc.circle(M + 7, y + 9, 5, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.white)
    doc.text(String(rec.priority), M + 7, y + 11, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.black)
    const titleLines = doc.splitTextToSize(rec.title, W - 2 * M - 24)
    doc.text(titleLines, M + 16, y + 8)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    const descLines = doc.splitTextToSize(rec.description, W - 2 * M - 24)
    doc.text(descLines, M + 16, y + 16)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.black)
    doc.text('Massnahme: ', M + 16, y + 28)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    const actionLines = doc.splitTextToSize(rec.action, W - 2 * M - 40)
    doc.text(actionLines, M + 38, y + 28)

    y += 40
  })

  // ─────────────────────────────────────────
  // SEITE 3: TOP-10-TABELLE
  // ─────────────────────────────────────────
  addStandardFooter(doc, 'BOM Risk Assessment')
  doc.addPage()
  y = 18

  doc.setFillColor(...C.blue)
  doc.rect(0, 0, W, 12, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Top 10 kritische Positionen', M, 8)
  y = 22

  const tableData = assessments.slice(0, 10).map(p => [
    String(p.priority),
    String(p.partNumber || '—'),
    String(p.description || '—').substring(0, 38) + (String(p.description || '').length > 38 ? '...' : ''),
    String(p.riskScore),
    String(p.riskCategory || '—'),
    formatCurrency(p.estimatedCostOfInaction),
  ])

  autoTable(doc, {
    startY: y,
    head: [['#', 'Teilenr.', 'Beschreibung', 'Score', 'Kategorie', 'Risikokosten']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: C.blue,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 32, font: 'courier', fontSize: 7 },
      2: { cellWidth: 68 },
      3: { cellWidth: 15, halign: 'center', fontStyle: 'bold', fontSize: 10 },
      4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell(data) {
      if (data.section !== 'body') return
      if (data.column.index === 3) {
        const s = parseInt(data.cell.raw)
        data.cell.styles.textColor = s >= 80 ? C.critical : s >= 60 ? C.high : s >= 40 ? C.medium : C.low
      }
      if (data.column.index === 4) {
        const cat = data.cell.raw
        const fill = cat === 'CRITICAL' ? C.critical : cat === 'HIGH' ? C.high : cat === 'MEDIUM' ? C.medium : C.low
        data.cell.styles.fillColor = fill
        data.cell.styles.textColor = C.white
      }
    },
  })

  addStandardFooter(doc, 'BOM Risk Assessment')
  addPageNumbers(doc)

  const ts = new Date().toISOString().split('T')[0]
  const cleanName = String(fileName || 'BOM').replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '_').substring(0, 40)
  doc.save(`Partflow_BOM_Risk_${cleanName}_${ts}.pdf`)

  return { success: true, pages: doc.internal.getNumberOfPages() }
}
