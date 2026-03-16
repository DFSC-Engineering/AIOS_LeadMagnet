import jsPDF from 'jspdf'
import { formatCurrency, formatPercent } from './calculations'
import { loadPartflowLogo, LOGO_PDF, CURRENT_YEAR, addStandardFooter, addPageNumbers } from './pdfHelpers'

const C = {
  cyan:      [0, 172, 193],
  cyanDark:  [0, 131, 148],
  green:     [56, 142, 60],
  greenBg:   [232, 245, 233],
  gray:      [97, 97, 97],
  grayLight: [245, 245, 245],
  grayMid:   [200, 200, 200],
  black:     [33, 33, 33],
  white:     [255, 255, 255],
}

export async function generatePDF(results, leadData) {
  const logoDataUrl = await loadPartflowLogo()

  const {
    totalCostOfFriction,
    frictionAsPercentOfRevenue,
    targetMargin,
    potentialMarginGain,
    newMargin,
    breakdown,
    recommendations,
    roi
  } = results

  const doc = new jsPDF()
  const W = doc.internal.pageSize.width   // 210
  const H = doc.internal.pageSize.height  // 297
  const M = 18  // margin
  let y = 0

  // ─────────────────────────────────────────
  // SEITE 1: HEADER + KENNZAHLEN
  // ─────────────────────────────────────────

  // Header-Band
  doc.setFillColor(...C.cyan)
  doc.rect(0, 0, W, 46, 'F')

  // Logo
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', M, 9, LOGO_PDF.w, LOGO_PDF.h)
  } else {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.white)
    doc.text('PARTFLOW', M + 2, 22)
  }

  // Titel
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Cost of Friction Analyse', W / 2, 20, { align: 'center' })
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.text('AI Business OS  |  Partflow.net', W / 2, 29, { align: 'center' })

  // Erstellt-Info rechts
  doc.setFontSize(8)
  doc.setTextColor(220, 245, 255)
  doc.text(`${leadData.firstname || ''} ${leadData.lastName || ''}`.trim(), W - M, 15, { align: 'right' })
  doc.text(leadData.company_name || '', W - M, 22, { align: 'right' })
  doc.text(new Date().toLocaleDateString('de-DE'), W - M, 29, { align: 'right' })

  y = 58

  // ── KENNZAHLEN GRID ──
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.black)
  doc.text('Ihre Kennzahlen im Überblick', M, y)
  y += 8

  const col = (W - 2 * M - 10) / 2
  const bh = 38

  // Box 1: Cost of Friction
  doc.setFillColor(...C.grayLight)
  doc.setDrawColor(...C.cyan)
  doc.setLineWidth(0.5)
  doc.rect(M, y, col, bh, 'FD')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text('COST OF FRICTION (GESAMT)', M + 5, y + 9)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.cyan)
  doc.text(formatCurrency(totalCostOfFriction), M + 5, y + 22)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text(`${formatPercent(frictionAsPercentOfRevenue, 1)} vom Jahresumsatz`, M + 5, y + 31)

  // Box 2: Margenpotenzial
  doc.setFillColor(...C.grayLight)
  doc.setDrawColor(...C.green)
  doc.rect(M + col + 10, y, col, bh, 'FD')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text('MARGENPOTENZIAL', M + col + 15, y + 9)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.green)
  doc.text(`+${formatPercent(potentialMarginGain, 1)}`, M + col + 15, y + 22)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text(`${formatPercent(targetMargin, 1)} -> ${formatPercent(newMargin, 1)} Zielmarge`, M + col + 15, y + 31)

  y += bh + 8

  // Box 3: ROI
  doc.setFillColor(...C.grayLight)
  doc.setDrawColor(...C.cyan)
  doc.rect(M, y, col, bh, 'FD')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text('AMORTISATION MIT PARTFLOW', M + 5, y + 9)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.cyan)
  doc.text(`${roi.roiMonths} Monate`, M + 5, y + 22)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text(`${roi.roiPercent}% ROI im ersten Jahr`, M + 5, y + 31)

  // Box 4: Einsparungen
  doc.setFillColor(...C.greenBg)
  doc.setDrawColor(...C.green)
  doc.rect(M + col + 10, y, col, bh, 'FD')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text('GESCHAETZTE JAHRESEINSPARUNG', M + col + 15, y + 9)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.green)
  doc.text(formatCurrency(roi.estimatedAnnualSavings), M + col + 15, y + 22)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text('bei 70% Reduktion der Reibungskosten', M + col + 15, y + 31)

  y += bh + 14

  // ── KOSTENPROFIL ──
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.black)
  doc.text('Kostenprofil nach Symptom-Clustern', M, y)
  y += 4
  doc.setDrawColor(...C.cyan)
  doc.setLineWidth(0.4)
  doc.line(M, y, W - M, y)
  y += 8

  Object.entries(breakdown).forEach(([, data]) => {
    if (y > H - 40) {
      addStandardFooter(doc, 'Cost of Friction Analyse')
      doc.addPage()
      y = 20
    }
    const [r, g, b] = hexToRgb(data.color)

    doc.setFillColor(248, 248, 248)
    doc.rect(M, y, W - 2 * M, 16, 'F')
    doc.setFillColor(r, g, b)
    doc.rect(M, y, 3, 16, 'F')

    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.black)
    doc.text(data.label, M + 8, y + 7)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text(`${formatPercent(data.percent, 1)} vom Gesamtbetrag`, M + 8, y + 13)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(r, g, b)
    doc.text(formatCurrency(data.value), W - M - 2, y + 8, { align: 'right' })

    y += 20
  })

  // ─────────────────────────────────────────
  // SEITE 2: HANDLUNGSEMPFEHLUNGEN
  // ─────────────────────────────────────────
  addStandardFooter(doc, 'Cost of Friction Analyse')
  doc.addPage()
  y = 18

  // Mini-Header Seite 2
  doc.setFillColor(...C.cyan)
  doc.rect(0, 0, W, 12, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Priorisierte Handlungsempfehlungen', M, 8)

  y = 22

  recommendations.forEach((rec) => {
    if (y > H - 55) {
      addStandardFooter(doc, 'Cost of Friction Analyse')
      doc.addPage()
      y = 20
    }

    const clusterKey = Object.keys(breakdown).find(k => breakdown[k].label === rec.cluster)
    const [r, g, b] = hexToRgb(breakdown[clusterKey]?.color || '#888888')

    // Prioritaets-Kreis
    doc.setFillColor(r, g, b)
    doc.circle(M + 5, y + 6, 5, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.white)
    doc.text(rec.priority.toString(), M + 5, y + 8, { align: 'center' })

    // Cluster-Label
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.black)
    doc.text(rec.cluster, M + 14, y + 8)

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text(`Jahreskosten: ${formatCurrency(rec.cost)}   Impact: ${formatPercent(rec.impact, 1)}`, M + 14, y + 14)

    y += 18

    // Loesungsbox
    doc.setFillColor(248, 253, 248)
    doc.setDrawColor(...C.grayMid)
    doc.setLineWidth(0.3)
    doc.rect(M + 8, y, W - 2 * M - 8, 28, 'FD')

    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.black)
    doc.text(rec.solution.title, M + 13, y + 8)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    const descLines = doc.splitTextToSize(rec.solution.description, W - 2 * M - 20)
    doc.text(descLines, M + 13, y + 15)

    y += 34
  })

  // ─────────────────────────────────────────
  // SEITE 3: ROI & PARTFLOW-VORTEIL
  // ─────────────────────────────────────────
  addStandardFooter(doc, 'Cost of Friction Analyse')
  doc.addPage()
  y = 18

  doc.setFillColor(...C.cyan)
  doc.rect(0, 0, W, 12, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('ROI-Projektion & Partflow-Vorteile', M, 8)

  y = 22

  // ROI-Box
  doc.setFillColor(...C.greenBg)
  doc.setDrawColor(...C.green)
  doc.setLineWidth(0.5)
  doc.rect(M, y, W - 2 * M, 52, 'FD')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text('GESCHAETZTE EINSPARUNGEN PRO JAHR', M + 6, y + 10)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.green)
  doc.text(formatCurrency(roi.estimatedAnnualSavings), M + 6, y + 24)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text('(70% Reduktion der Cost of Friction)', M + 6, y + 31)

  doc.setFontSize(8)
  doc.text('AMORTISATIONSDAUER', M + 6, y + 40)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.cyan)
  doc.text(`${roi.roiMonths} Monate`, M + 6, y + 48)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text(`Setup-Kosten: ${formatCurrency(roi.setupCost)}`, M + 90, y + 48)

  y += 62

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.black)
  doc.text('Warum Partflow.net?', M, y)
  y += 6

  const vorteile = [
    ['24h Angebotszeit', 'Statt 5-15 Tage Wartezeit bei traditionellen Lieferanten'],
    ['Ein Ansprechpartner', 'Statt 5+ Lieferanten gleichzeitig zu koordinieren'],
    ['Direkte CAD-Integration', 'Eliminiert manuelles Abtippen und Uebertragungsfehler'],
    ['200+ ISO-zertifizierte Partner', 'In 12 europaeischen Laendern, fuer Standard- und Sonderteile'],
    ['15-30% Kosteneinsparungen', 'Durch optimierte Beschaffung und Wettbewerb unter Lieferanten'],
    ['40% schnellere Lieferung', 'Im Vergleich zu traditionellen Beschaffungsprozessen'],
  ]

  vorteile.forEach(([title, desc]) => {
    if (y > H - 40) {
      addStandardFooter(doc, 'Cost of Friction Analyse')
      doc.addPage()
      y = 20
    }
    doc.setFillColor(248, 248, 248)
    doc.rect(M, y, W - 2 * M, 14, 'F')
    doc.setFillColor(...C.cyan)
    doc.rect(M, y, 3, 14, 'F')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.black)
    doc.text(title, M + 8, y + 6)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text(desc, M + 8, y + 11)
    y += 17
  })

  y += 8

  // CTA-Banner
  if (y > H - 40) {
    addStandardFooter(doc, 'Cost of Friction Analyse')
    doc.addPage()
    y = 20
  }
  doc.setFillColor(...C.cyan)
  doc.rect(M, y, W - 2 * M, 28, 'F')
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Bereit, Ihre Margen zu optimieren?', W / 2, y + 11, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('www.partflow.net  |  info@partflow.net  |  +49 6331 7296114', W / 2, y + 21, { align: 'center' })

  addStandardFooter(doc, 'Cost of Friction Analyse')
  addPageNumbers(doc)

  const filename = `Partflow_Cost_of_Friction_${(leadData.company_name || 'Report').replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [100, 100, 100]
}
