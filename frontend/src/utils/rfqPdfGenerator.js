import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = {
  primary: [0, 122, 204],
  orange: [234, 88, 12],
  amber: [217, 119, 6],
  green: [34, 197, 94],
  red: [220, 38, 38],
  yellow: [234, 179, 8],
  gray: [107, 114, 128],
  lightGray: [243, 244, 246],
  white: [255, 255, 255],
  darkGray: [31, 41, 55]
}

export function generateRfqPDF(analysisResult, leadData) {
  try {
    const {
      projektInfo = {},
      positionen = [],
      technischeAnforderungen = [],
      lieferbedingungen = {},
      triage = {},
      offeneFragen = [],
      partflowRelevanz = {}
    } = analysisResult

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 20
    let yPos = 20

    const checkPageBreak = (needed = 30) => {
      if (yPos + needed > pageHeight - 30) {
        addFooter(doc, pageWidth, pageHeight, margin)
        doc.addPage()
        yPos = 20
        return true
      }
      return false
    }

    const drawBox = (x, y, w, h, bgColor, borderColor = null) => {
      doc.setFillColor(...bgColor)
      if (borderColor) {
        doc.setDrawColor(...borderColor)
        doc.rect(x, y, w, h, 'FD')
      } else {
        doc.rect(x, y, w, h, 'F')
      }
    }

    const addSectionTitle = (title) => {
      checkPageBreak(15)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(title, margin, yPos)
      yPos += 2
      doc.setDrawColor(...COLORS.orange)
      doc.setLineWidth(0.5)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 10
    }

    // ==========================================
    // PAGE 1: HEADER
    // ==========================================
    drawBox(0, 0, pageWidth, 45, COLORS.orange)

    doc.setFillColor(...COLORS.white)
    doc.roundedRect(15, 10, 40, 25, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text('PARTFLOW', 20, 23)

    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.white)
    doc.text('RFQ TRIAGE ANALYSE', pageWidth / 2, 22, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('AI Business OS — Anfragenanalyse Report', pageWidth / 2, 32, { align: 'center' })

    yPos = 55

    // Report info box
    drawBox(margin, yPos, pageWidth - 2 * margin, 30, COLORS.lightGray, COLORS.gray)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Projekt:', margin + 5, yPos + 8)
    doc.setFont('helvetica', 'normal')
    const projektText = (projektInfo.titel || 'Unbekannt').substring(0, 60)
    doc.text(projektText, margin + 30, yPos + 8)

    doc.setFont('helvetica', 'bold')
    doc.text('Auftraggeber:', margin + 5, yPos + 16)
    doc.setFont('helvetica', 'normal')
    doc.text(projektInfo.kunde || 'Unbekannt', margin + 40, yPos + 16)

    doc.setFont('helvetica', 'bold')
    doc.text('Erstellt:', margin + 5, yPos + 24)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 30, yPos + 24)

    if (projektInfo.angebotsFrist) {
      doc.setFont('helvetica', 'bold')
      doc.text('Frist:', pageWidth / 2 + 5, yPos + 8)
      doc.setFont('helvetica', 'normal')
      doc.text(projektInfo.angebotsFrist, pageWidth / 2 + 25, yPos + 8)
    }

    yPos += 42

    // ==========================================
    // TRIAGE AMPEL
    // ==========================================
    addSectionTitle('TRIAGE-ENTSCHEIDUNG')

    const empfehlung = triage.empfehlung || 'MAYBE'
    const triageColors = {
      GO: { bg: [220, 252, 231], border: COLORS.green, text: [21, 128, 61] },
      MAYBE: { bg: [254, 243, 199], border: COLORS.yellow, text: [161, 98, 7] },
      NO_GO: { bg: [254, 226, 226], border: COLORS.red, text: [185, 28, 28] }
    }
    const tc = triageColors[empfehlung] || triageColors.MAYBE

    drawBox(margin, yPos, pageWidth - 2 * margin, 45, tc.bg, tc.border)

    // Empfehlung Badge
    doc.setFillColor(...tc.border)
    doc.roundedRect(margin + 5, yPos + 8, 35, 12, 2, 2, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.white)
    doc.text(empfehlung, margin + 22, yPos + 16, { align: 'center' })

    // Win-Probability
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...tc.text)
    doc.text(`${triage.winWahrscheinlichkeit || '—'}%`, pageWidth - margin - 5, yPos + 20, { align: 'right' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Win-Wahr.', pageWidth - margin - 5, yPos + 28, { align: 'right' })

    // Begründung
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const begruendungLines = doc.splitTextToSize(triage.begruendung || '', pageWidth - 2 * margin - 60)
    doc.text(begruendungLines, margin + 48, yPos + 12)

    yPos += 55

    // Aufwand
    if (triage.aufwandsSchaetzung) {
      const as = triage.aufwandsSchaetzung
      drawBox(margin, yPos, pageWidth - 2 * margin, 22, COLORS.lightGray)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Aufwand:', margin + 5, yPos + 8)
      doc.setFont('helvetica', 'normal')
      doc.text(`${as.stunden}h (${as.komplexitaet || '—'}) — ${as.begruendung || ''}`, margin + 30, yPos + 8)
      yPos += 30
    }

    // ==========================================
    // POSITIONEN TABLE
    // ==========================================
    if (positionen.length > 0) {
      checkPageBreak(20)
      addSectionTitle(`EXTRAHIERTE POSITIONEN (${positionen.length})`)

      const tableData = positionen.map(pos => [
        String(pos.pos || '—'),
        String(pos.teilenummer || '—'),
        String(pos.beschreibung || '—').substring(0, 50),
        `${pos.menge || '—'} ${pos.einheit || ''}`,
        String(pos.material || '—'),
        String(pos.toleranz || '—')
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['Pos.', 'Teilenr.', 'Beschreibung', 'Menge', 'Material', 'Toleranz']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.orange,
          textColor: COLORS.white,
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 30, font: 'courier', fontSize: 6 },
          2: { cellWidth: 65 },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 28 },
          5: { cellWidth: 20, font: 'courier', fontSize: 6 }
        }
      })

      yPos = doc.lastAutoTable.finalY + 15
    }

    // ==========================================
    // NEW PAGE: EMPFEHLUNGEN & OFFENE FRAGEN
    // ==========================================
    addFooter(doc, pageWidth, pageHeight, margin)
    doc.addPage()
    yPos = 20

    // Stärken & Risiken
    if (triage.staerken?.length > 0 || triage.risiken?.length > 0) {
      addSectionTitle('STÄRKEN & RISIKEN')

      const halfWidth = (pageWidth - 2 * margin - 10) / 2

      if (triage.staerken?.length > 0) {
        drawBox(margin, yPos, halfWidth, 8, COLORS.green)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.white)
        doc.text('STÄRKEN', margin + halfWidth / 2, yPos + 5.5, { align: 'center' })

        let sy = yPos + 12
        triage.staerken.forEach(s => {
          const lines = doc.splitTextToSize(`+ ${s}`, halfWidth - 10)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(21, 128, 61)
          doc.text(lines, margin + 5, sy)
          sy += lines.length * 5 + 3
        })
      }

      if (triage.risiken?.length > 0) {
        const rx = margin + halfWidth + 10
        drawBox(rx, yPos, halfWidth, 8, COLORS.red)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.white)
        doc.text('RISIKEN', rx + halfWidth / 2, yPos + 5.5, { align: 'center' })

        let ry = yPos + 12
        triage.risiken.forEach(r => {
          const lines = doc.splitTextToSize(`! ${r}`, halfWidth - 10)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(185, 28, 28)
          doc.text(lines, rx + 5, ry)
          ry += lines.length * 5 + 3
        })
      }

      yPos += Math.max(
        8 + (triage.staerken?.length || 0) * 12,
        8 + (triage.risiken?.length || 0) * 12
      ) + 15
    }

    // Offene Fragen
    if (offeneFragen.length > 0) {
      checkPageBreak(20)
      addSectionTitle('OFFENE FRAGEN VOR ANGEBOTSABGABE')

      offeneFragen.forEach((frage, idx) => {
        checkPageBreak(12)
        drawBox(margin, yPos, pageWidth - 2 * margin, 10, [255, 251, 235], COLORS.amber)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.amber)
        doc.text(`${idx + 1}.`, margin + 5, yPos + 7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        const fragenLines = doc.splitTextToSize(frage, pageWidth - 2 * margin - 15)
        doc.text(fragenLines, margin + 15, yPos + 7)
        yPos += Math.max(14, fragenLines.length * 5 + 6)
      })

      yPos += 10
    }

    // Technische Anforderungen
    if (technischeAnforderungen.length > 0) {
      checkPageBreak(20)
      addSectionTitle('TECHNISCHE ANFORDERUNGEN')

      technischeAnforderungen.forEach(req => {
        checkPageBreak(10)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(`• ${req}`, margin + 5, yPos)
        yPos += 7
      })

      yPos += 10
    }

    // ==========================================
    // PARTFLOW CTA PAGE
    // ==========================================
    addFooter(doc, pageWidth, pageHeight, margin)
    doc.addPage()
    yPos = 20

    drawBox(0, 0, pageWidth, pageHeight, [240, 249, 255])

    drawBox(0, 0, pageWidth, 50, COLORS.primary)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.white)
    doc.text('NÄCHSTE SCHRITTE', pageWidth / 2, 25, { align: 'center' })
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Teile beschaffen mit Partflow.net', pageWidth / 2, 38, { align: 'center' })

    yPos = 65

    if (partflowRelevanz.empfehlung) {
      drawBox(margin, yPos, pageWidth - 2 * margin, 25, COLORS.white, COLORS.primary)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.primary)
      const pfLines = doc.splitTextToSize(partflowRelevanz.empfehlung, pageWidth - 2 * margin - 15)
      doc.text(pfLines, margin + 8, yPos + 8)
      yPos += 35
    }

    const benefits = [
      ['⚡ 24h Angebotszeit', 'Statt 5-15 Tage Wartezeit'],
      ['🏭 200+ Partner', 'ISO-zertifiziert in 12 Ländern'],
      ['💰 15-30% Kosteneinsparung', 'Durch optimierte Beschaffung'],
      ['🔗 Ein Ansprechpartner', 'Statt 5+ Lieferanten koordinieren'],
    ]

    benefits.forEach(([title, desc]) => {
      checkPageBreak(25)
      drawBox(margin, yPos, pageWidth - 2 * margin, 20, COLORS.white, COLORS.lightGray)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.primary)
      doc.text(title, margin + 10, yPos + 8)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.gray)
      doc.text(desc, margin + 10, yPos + 15)
      yPos += 25
    })

    yPos += 15
    drawBox(margin, yPos, pageWidth - 2 * margin, 30, COLORS.primary)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.white)
    doc.text('www.partflow.net', pageWidth / 2, yPos + 13, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Jetzt kostenlos Anfrage stellen →', pageWidth / 2, yPos + 23, { align: 'center' })

    addFooter(doc, pageWidth, pageHeight, margin)

    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.gray)
      doc.text(`Seite ${i} von ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
    }

    const timestamp = new Date().toISOString().split('T')[0]
    const safeName = (projektInfo.titel || 'RFQ').replace(/[^a-z0-9]/gi, '_').substring(0, 30)
    doc.save(`RFQ_Triage_${safeName}_${timestamp}.pdf`)

    return { success: true }
  } catch (error) {
    console.error('RFQ PDF Error:', error)
    throw new Error(`PDF-Generierung fehlgeschlagen: ${error.message}`)
  }
}

function addFooter(doc, pageWidth, pageHeight, margin) {
  doc.setFillColor(240, 240, 240)
  doc.rect(0, pageHeight - 25, pageWidth, 25, 'F')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.text('© 2025 Partflow.net — Powered by DFSC Engineering', margin, pageHeight - 12)
  doc.text('info@partflow.net | +49 6331 7296114', pageWidth / 2, pageHeight - 12, { align: 'center' })
  doc.text('www.partflow.net', pageWidth - margin, pageHeight - 12, { align: 'right' })
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text('AI Business OS — RFQ Triage Agent', pageWidth / 2, pageHeight - 6, { align: 'center' })
}
